import {
  test,
  expect,
  chromium,
  Browser,
  BrowserContext,
  Page,
  APIRequestContext,
  Locator,
} from "@playwright/test";
import {
  loginAsTutor,
  loginAsStudent,
  loginAsInterventionStudent,
  getApiContext,
  acceptCookiesIfVisible,
  cleanUpClassProgress,
} from "../helper/setup";
import testConfigs from "../test-configs";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe.configure({
  retries: process.env.CI ? 2 : 0,
  timeout: 500000,
});

declare global {
  interface Window {
    meeting?: {
      self: {
        enableAudio: () => Promise<void>;
        disableAudio: () => Promise<void>;
        audioEnabled: boolean;
        audioMuted: boolean;
        audioTrack?: any;
        on?: (event: string, callback: (data: any) => void) => void;
        off?: (event: string, callback: (data: any) => void) => void;
      };
      participants: {
        joined: Record<
          string,
          {
            id: string;
            name?: string;
            displayName?: string;
            audioEnabled: boolean;
            audioMuted: boolean;
            audioTrack?: any;
            customParticipantId?: string;
            presetName?: string;
          }
        >;
      };
    };
  }
}

test.describe("Intervention Tests", () => {
  // Browser and context variables
  let student1_browser: Browser | null = null;
  let student2_browser: Browser | null = null;
  let tutor_browser: Browser | null = null;
  let browserContext_Student1: BrowserContext | null = null;
  let browserContext_Student2: BrowserContext | null = null;
  let browserContext_Tutor: BrowserContext | null = null;

  // Page variables
  let page_Student1: Page | null = null;
  let page_Student2: Page | null = null;
  let page_Tutor: Page | null = null;
  let page_Student1_Meeting: Page | null = null;
  let page_Student2_Meeting: Page | null = null;
  let page_Tutor_Meeting: Page | null = null;

  // API and class variables
  let apiContext: APIRequestContext;
  let classId: string = "";

  // Socket capture
  let tutorSocketEventData: any;
  let student1SocketEventData: any;
  let student2SocketEventData: any;

  // Timeouts
  const TIMEOUT = {
    SHORT: 2000,
    MEDIUM: 10000,
    LONG: 20000,
    XLONG: 100000,
  };

  const handlePreviousClassFeedbackModal = async (page: Page) => {
    const feedbackModal = page.getByText("Previous Class Feedback");
    if (await feedbackModal.isVisible({ timeout: TIMEOUT.LONG })) {
      await expect(
        page.getByRole("heading", { name: "Did you enjoy your previous" })
      ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Previous class feedback modal is visible to the student");
      await page.getByLabel("😊Yes, very much!").check();
      console.log(
        "Student selected 'Yes, very much!' for previous class feedback"
      );
      await expect(
        page.getByRole("button", { name: "Submit Feedback" })
      ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Submit Feedback button is visible to the student");
      await page
        .getByRole("button", { name: "Submit Feedback" })
        .click({ timeout: TIMEOUT.MEDIUM });
      console.log("Student submitted the previous class feedback");
      await page.waitForTimeout(2000);
    } else {
      console.log("Previous class feedback modal is not visible");
    }
  };

  const handleOngoingChaptersModal = async (page: Page) => {
    console.log(
      "Waiting 10 seconds for the Ongoing Chapters modal to appear..."
    );
    await page.waitForTimeout(10000);

    const modalVisible = await page
      .locator("span")
      .filter({ hasText: "Ongoing Chapters" })
      .isVisible({ timeout: TIMEOUT.LONG });
    if (!modalVisible) {
      console.log("Ongoing Chapters modal did not appear — skipping...");
      return;
    }

    console.log(
      "Ongoing Chapters modal appeared — selecting 'No Ongoing Chapters'..."
    );
    await page.getByText("No Ongoing Chapters").nth(1).click();
    await page.getByText("No Ongoing Chapters").nth(2).click();

    console.log("Selections made — submitting...");
    await page
      .getByRole("button", { name: "Submit" })
      .click({ timeout: TIMEOUT.MEDIUM });

    console.log("Ongoing Chapters modal submitted successfully.");
  };

  const waitForGroupAssignment = async () => {
    console.log("[Groups] Waiting for assignment settle…");
    if (page_Tutor_Meeting)
      await page_Tutor_Meeting.waitForTimeout(TIMEOUT.SHORT);
    if (page_Student1_Meeting)
      await page_Student1_Meeting.waitForTimeout(TIMEOUT.SHORT);
    if (page_Student2_Meeting)
      await page_Student2_Meeting.waitForTimeout(TIMEOUT.SHORT);
    console.log("[Groups] Settle done");
  };

  const cleanupRedisClass = async (classIdParam: string) => {
    console.log("[Cleanup][Redis] Starting…");
    if (!classIdParam) {
      console.log("[Cleanup][Redis] No classId — skipping");
      return;
    }
    try {
      const res = await apiContext.post(
        "/api/v2/functional-tests-helper/delete-class-redis-item",
        { data: { classId: classIdParam } }
      );
      const body = await res.json();
      console.log(
        "[Cleanup][Redis] Done:",
        body?.data?.message ?? "No message"
      );
    } catch (e: any) {
      console.warn("[Cleanup][Redis] Non-critical failure:", e?.message);
    }
  };

  const performCleanup = async () => {
    console.log("[Cleanup] Starting comprehensive cleanup…");
    try {
      await cleanUpClassProgress();
      console.log("[Cleanup] Class progress cleared");
    } catch (e: any) {
      console.warn("[Cleanup] class progress cleanup failed:", e?.message);
    }
    try {
      if (classId) {
        await cleanupRedisClass(classId);
      } else {
        console.log("[Cleanup] No classId to clean in Redis");
      }
    } catch (e: any) {
      console.warn("[Cleanup] Redis cleanup failed:", e?.message);
    }
    console.log("[Cleanup] Completed");
  };

  test.beforeAll(async ({ browserName }) => {
    console.log("[Setup] Intervention beforeAll");
    if (browserName.toLowerCase() !== "chromium") {
      console.log("[Setup] Non-Chromium run — skipping environment setup");
      return;
    }

    console.log("[Setup] Launching browsers…");
    student1_browser = await chromium.launch({
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--no-sandbox",
      ],
    });
    student2_browser = await chromium.launch({
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--no-sandbox",
      ],
    });
    tutor_browser = await chromium.launch({ args: ["--no-sandbox"] });

    apiContext = await getApiContext();
    console.log("[Setup] API context ok");

    browserContext_Student1 = await student1_browser.newContext({
      permissions: ["microphone"],
    });
    browserContext_Student2 = await student2_browser.newContext({
      permissions: ["microphone"],
    });
    browserContext_Tutor = await tutor_browser.newContext({
      permissions: ["microphone"],
    });

    page_Student1 = await browserContext_Student1.newPage();
    page_Student2 = await browserContext_Student2.newPage();
    page_Tutor = await browserContext_Tutor.newPage();

    console.log("[Setup] Logging in student 1…");
    await loginAsStudent(page_Student1);
    console.log("[Setup] Logging in student 2 (intervention)…");
    await loginAsInterventionStudent(page_Student2);
    console.log("[Setup] Logging in tutor…");
    await loginAsTutor(page_Tutor);

    console.log("[Setup] Pre-clean class progress…");
    await cleanUpClassProgress();

    console.log("[Setup] Done");
  });

  test.afterAll(async ({ browserName }) => {
    console.log("[Teardown] Intervention afterAll");
    if (browserName.toLowerCase() !== "chromium") {
      console.log("[Teardown] Non-Chromium run — skipping");
      return;
    }

    await performCleanup();

    console.log("[Teardown] Closing browsers…");
    try {
      if (student1_browser) await student1_browser.close();
    } catch {}
    try {
      if (student2_browser) await student2_browser.close();
    } catch {}
    try {
      if (tutor_browser) await tutor_browser.close();
    } catch {}
    console.log("[Teardown] Done");
  });

  test("INTERVENTION | TC-01: Class Setup and Participant Joining", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      "Test only for Chromium!"
    );

    if (!page_Tutor || !page_Student1 || !page_Student2) {
      throw new Error("[TC-01] Base pages not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG);

    console.log("[TC-01] Tutor: open meeting from dashboard");
    await acceptCookiesIfVisible(page_Tutor);
    await expect(page_Tutor.getByLabel("Show only Scheduled")).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor.getByLabel("Show only Scheduled").check();

    const joinButton = page_Tutor
      .getByRole("button", { name: "Join Class" })
      .first();
    await expect(joinButton).toBeVisible({ timeout: TIMEOUT.MEDIUM });

    [page_Tutor_Meeting] = await Promise.all([
      page_Tutor.context().waitForEvent("page"),
      joinButton.click({ timeout: TIMEOUT.MEDIUM }),
    ]);
    console.log("[TC-01] Tutor meeting window opened");
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
    await page_Tutor_Meeting.waitForTimeout(TIMEOUT.SHORT);

    classId = page_Tutor_Meeting?.url()?.split("?")?.[1]?.substring(3) || "";
    console.log("[TC-01] Extracted classId:", classId);

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Join" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Tutor_Meeting
      .getByRole("button", { name: "Join" })
      .first()
      .click({ timeout: TIMEOUT.MEDIUM });
    console.log("[TC-01] Tutor joined the meeting");

    console.log("[TC-01] Student 1 join flow");
    const student1JoinBtn = page_Student1
      .getByRole("button", { name: "Join Now" })
      .first();
    [page_Student1_Meeting] = await Promise.all([
      page_Student1.context().waitForEvent("page"),
      student1JoinBtn.click({ timeout: TIMEOUT.LONG }),
    ]);
    console.log("[TC-01] Student 1 meeting window opened");
    await page_Student1_Meeting.waitForTimeout(5000);
    await page_Student1_Meeting.waitForLoadState("domcontentloaded");
    await page_Student1_Meeting.waitForLoadState("networkidle");
    console.log("Student meeting page loaded");
    await handlePreviousClassFeedbackModal(page_Student1_Meeting);
    await acceptCookiesIfVisible(page_Student1_Meeting);
    await expect(
      page_Student1_Meeting.getByRole("button", { name: "Join Now" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Student1_Meeting
      .getByRole("button", { name: "Join Now" })
      .click({ timeout: TIMEOUT.LONG });
    console.log("[TC-01] Student 1 joined");

    console.log("[TC-01] Student 2 join flow");
    const student2JoinBtn = page_Student2
      .getByRole("button", { name: "Join Now" })
      .first();
    [page_Student2_Meeting] = await Promise.all([
      page_Student2.context().waitForEvent("page"),
      student2JoinBtn.click({ timeout: TIMEOUT.LONG }),
    ]);
    console.log("[TC-01] Student 2 meeting window opened");
    await page_Student2_Meeting.waitForTimeout(5000);
    await page_Student2_Meeting.waitForLoadState("domcontentloaded");
    await page_Student2_Meeting.waitForLoadState("networkidle");
    console.log("Student 2 meeting page loaded");
    await handlePreviousClassFeedbackModal(page_Student2_Meeting);
    await acceptCookiesIfVisible(page_Student2_Meeting);
    await expect(
      page_Student2_Meeting.getByRole("button", { name: "Join Now" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Student2_Meeting
      .getByRole("button", { name: "Join Now" })
      .click({ timeout: TIMEOUT.LONG });
    console.log("[TC-01] Student 2 joined");

    console.log("[TC-01] ✅ All participants joined & meeting ready");
  });

  test("INTERVENTION | TC-02: Group Assignment and Start Groups Modal Verification", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      "Test only for Chromium!"
    );

    if (!page_Tutor_Meeting)
      throw new Error("[TC-02] page_Tutor_Meeting is null");

    test.setTimeout(TIMEOUT.XLONG);
    console.log("[TC-02] Opening Present Content…");

    await expect(
      page_Tutor_Meeting.locator('button[title="Present Content"]')
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting
      .locator('button[title="Present Content"]')
      .click({ timeout: TIMEOUT.MEDIUM });
    await page_Tutor_Meeting.waitForTimeout(TIMEOUT.SHORT * 2);
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
    await handleOngoingChaptersModal(page_Tutor_Meeting);

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "More Options" })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting
      .getByRole("button", { name: "More Options" })
      .click();

    await expect(
      page_Tutor_Meeting.getByRole("menuitem", {
        name: "intervention Intervention",
      })
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await page_Tutor_Meeting
      .getByRole("menuitem", { name: "intervention Intervention" })
      .click();
    console.log("[TC-02] Intervention modal opened");

    const student1 = page_Tutor_Meeting.getByRole("button", {
      name: "QATest User Unnamed Group",
    });
    const group1 = page_Tutor_Meeting.getByRole("list").nth(3);
    await student1.waitFor({ state: "visible" });
    await group1.waitFor({ state: "visible" });

    const from = await student1.boundingBox();
    const to = await group1.boundingBox();
    if (!from || !to)
      throw new Error("[TC-02] Could not resolve bounding boxes for S1 → G1");

    await page_Tutor_Meeting.mouse.move(
      from.x + from.width / 2,
      from.y + from.height / 2
    );
    await page_Tutor_Meeting.mouse.down({ button: "left" });
    await page_Tutor_Meeting.waitForTimeout(120);
    await page_Tutor_Meeting.mouse.move(
      to.x + to.width / 2,
      to.y + Math.min(40, to.height / 2),
      {
        steps: 20,
      }
    );
    await page_Tutor_Meeting.mouse.up();
    await expect(group1).toContainText("QATest User");
    console.log("[TC-02] Student 1 assigned to Group 1");

    const student2 = page_Tutor_Meeting.getByRole("button", {
      name: "QA Intervention Unnamed Group",
    });
    const group2 = page_Tutor_Meeting.getByRole("list").nth(4);
    await student2.waitFor({ state: "visible" });
    await group2.waitFor({ state: "visible" });

    const from2 = await student2.boundingBox();
    const to2 = await group2.boundingBox();
    if (!from2 || !to2)
      throw new Error("[TC-02] Could not resolve bounding boxes for S2 → G2/3");

    await page_Tutor_Meeting.mouse.move(
      from2.x + from2.width / 2,
      from2.y + from2.height / 2
    );
    await page_Tutor_Meeting.mouse.down({ button: "left" });
    await page_Tutor_Meeting.waitForTimeout(120);
    await page_Tutor_Meeting.mouse.move(
      to2.x + to2.width / 2,
      to2.y + Math.min(40, to2.height / 2),
      {
        steps: 40,
      }
    );
    await page_Tutor_Meeting.mouse.up();
    await expect(group2).toContainText("QA Intervention");
    console.log("[TC-02] Student 2 assigned to Group 2/3");

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Assign" })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting.getByRole("button", { name: "Assign" }).click();
    await waitForGroupAssignment();

    console.log("[TC-02] ✅ Group assignments confirmed");
  });

  test("INTERVENTION | TC-03: Content Delivery Per Group and Evaluation Functionality", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      "Test only for Chromium!"
    );
    if (
      !page_Tutor_Meeting ||
      !page_Student1_Meeting ||
      !page_Student2_Meeting
    ) {
      throw new Error("[TC-03] One or more meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG);
    console.log("[TC-03] Presenting content in Group 1…");

    await expect(
      page_Tutor_Meeting.locator('button[title="Present Content"]')
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting
      .locator('button[title="Present Content"]')
      .click({ timeout: TIMEOUT.MEDIUM });
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
    await page_Student1_Meeting.waitForLoadState("domcontentloaded");

    await expect(page_Student1_Meeting.getByText("Evaluation")).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });

    await expect(
      page_Student2_Meeting
        .locator("#mainClass div")
        .filter({ hasText: "The tutor will be joining" })
        .nth(1)
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    console.log(
      "[TC-03] G1: Evaluation visible to tutor & Student1; G2/3: waiting message visible to Student2"
    );

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Resume" })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting.getByRole("button", { name: "Resume" }).click();

    await expect(page_Tutor_Meeting.getByRole('button', { name: 'Start' }).nth(2)).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting.getByRole('button', { name: 'Start' }).nth(2).click();

    await expect(
      page_Student1_Meeting.getByRole("heading", { name: "Guided Examples" })
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await expect(
      page_Student1_Meeting.getByText(
        "Write the following using numbers, literals and signs of basic operations: 150"
      )
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });

    await expect(
      page_Student1_Meeting.getByRole("button", { name: "Move to Questions" })
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await page_Student1_Meeting
      .getByRole("button", { name: "Move to Questions" })
      .click();

    await expect(
      page_Student1_Meeting.getByRole("button", {
        name: "Attempt questions now",
      })
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await page_Student1_Meeting
      .getByRole("button", { name: "Attempt questions now" })
      .click();

    await expect(
      page_Student1_Meeting.getByText(
        "Write the following using numbers, literals and signs of basic operations: 115"
      )
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });

    console.log("[TC-03] ✅ Evaluation flow verified in Group 1");
  });

  test("INTERVENTION | TC-04: Tutor Switches Between Groups", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      "Test only for Chromium!"
    );
    if (
      !page_Tutor_Meeting ||
      !page_Student1_Meeting ||
      !page_Student2_Meeting
    ) {
      throw new Error("[TC-04] One or more meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG);
    console.log("[TC-04] Tutor switching to Group 2/3…");

    await expect(
      page_Tutor_Meeting.getByRole("link", { name: "Group 2/" })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting.getByRole("link", { name: "Group 2/" }).click();

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Present Content" })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting
      .getByRole("button", { name: "Present Content" })
      .click();

    await expect(
      page_Tutor_Meeting.getByRole("img", { name: "back", exact: true })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting
      .getByRole("img", { name: "back", exact: true })
      .click();

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Start" })
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting.getByRole("button", { name: "Start" }).click();

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Start" }).nth(2)
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await page_Tutor_Meeting
      .getByRole("button", { name: "Start" })
      .nth(2)
      .click();

    await expect(
      page_Tutor_Meeting.getByText("Write all the integers")
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });

    await expect(
      page_Student2_Meeting.getByText("Solve these questions in your")
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    await expect(
      page_Student2_Meeting.getByText("Write all the integers")
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });

    console.log("[TC-04] Group 2/3 evaluation visible to tutor & student");

    await expect(
      page_Tutor_Meeting.getByRole("main").getByText("QA Intervention")
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });

    await page_Student2_Meeting.reload();
    await page_Student2_Meeting.waitForTimeout(TIMEOUT.SHORT * 2);
    await page_Student2_Meeting.waitForLoadState("domcontentloaded");
    await expect(
      page_Student2_Meeting.getByRole("button", { name: "Join Now" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Student2_Meeting
      .getByRole("button", { name: "Join Now" })
      .click({ timeout: TIMEOUT.LONG });

    await expect(
      page_Student2_Meeting.getByText("Solve these questions in your")
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });

    await page_Tutor_Meeting.reload();
    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Join" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Tutor_Meeting
      .getByRole("button", { name: "Join" })
      .first()
      .click({ timeout: TIMEOUT.MEDIUM });

    console.log("[TC-04] ✅ Tutor switched back to main room after Group 2/3");
  });

  test("INTERVENTION | TC-05: Audio - Enable audio for both students", async ({ browserName }) => {
    test.skip(browserName.toLowerCase() !== "chromium", "Test only for Chromium!");
    test.setTimeout(TIMEOUT.XLONG);
  
    console.log("[TC-05] Testing audio for both students…");
  
    // Helper function reused for any student meeting page
    const enableAndVerifyAudio = async (page: Page, studentLabel: string) => {
      console.log(`[TC-05] Checking meeting readiness for ${studentLabel}…`);
      await page.waitForFunction(() => {
        const tile = document.querySelector("dyte-participant-tile") as any;
        return !!(
          tile &&
          tile.meeting &&
          tile.meeting.self &&
          typeof tile.meeting.self.enableAudio === "function"
        );
      }, { timeout: TIMEOUT.LONG });
  
      const meetingDebug = await page.evaluate(() => {
        const tile = document.querySelector("dyte-participant-tile") as any;
        const meeting = tile?.meeting;
        return {
          hasMeeting: !!meeting,
          hasSelf: !!meeting?.self,
          hasEnableAudio: !!meeting?.self?.enableAudio,
          audioEnabled: !!meeting?.self?.audioEnabled,
          audioMuted: !!meeting?.self?.audioMuted,
        };
      });
      console.log(`[TC-05] ${studentLabel} meeting debug:`, meetingDebug);
  
      console.log(`[TC-05] Enabling audio for ${studentLabel}…`);
      await page.evaluate(async () => {
        const tile = document.querySelector("dyte-participant-tile") as any;
        await tile?.meeting?.self?.enableAudio();
      });
  
      // Poll until audioEnabled flips to true
      await expect
        .poll(
          async () => {
            return await page.evaluate(() => {
              const tile = document.querySelector("dyte-participant-tile") as any;
              return tile?.meeting?.self?.audioEnabled ?? false;
            });
          },
          { timeout: 10000, intervals: [250, 500, 1000] }
        )
        .toBe(true);
  
      console.log(`[TC-05] ✅ ${studentLabel} audio enabled successfully`);
    };
  
    // Run for both Student 1 and Student 2
    await enableAndVerifyAudio(page_Student1_Meeting!, "Student 1");
    await enableAndVerifyAudio(page_Student2_Meeting!, "Student 2");
  
    console.log("[TC-05] ✅ Audio enabled successfully for both students");
  });  
});
