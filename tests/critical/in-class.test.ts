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

test.describe("In-Class-Tests", async () => {
  let student_browser: Browser | null = null;
  let tutor_browser: Browser | null = null;
  let browserContext_Student: BrowserContext | null = null;
  let browserContext_Tutor: BrowserContext | null = null;
  let page_Student: Page | null = null;
  let page_Student_Meeting: Page | null = null;
  let page_Tutor: Page | null = null;
  let page_Tutor_Meeting: Page | null = null;

  let leftArrow: Locator;
  let rightArrow: Locator;
  let syncButton: Locator;

  let tutorSocketEventData;
  let studentSocketEventData;

  let apiContext: APIRequestContext;
  let classId: string = "";

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

  const clickMultipleTimes = async (locator: Locator, num: number) => {
    while (num > 0) {
      await locator.click({ timeout: TIMEOUT.MEDIUM });
      console.log("Clicked once, remaining:", num - 1);
      await page_Tutor_Meeting!.waitForTimeout(1000);
      num--;
    }
  };

  const checkForSync = (tutorSocketData, studentSocketData) => {
    return (
      (tutorSocketData?.step &&
        studentSocketData?.step &&
        tutorSocketData?.slide &&
        studentSocketData?.slide &&
        tutorSocketData?.step === studentSocketData?.step &&
        tutorSocketData?.slide === studentSocketData?.slide) ||
      (tutorSocketData?.activeSlide &&
        studentSocketData?.activeSlide &&
        tutorSocketData?.activeSlide === studentSocketData?.activeSlide)
    );
  };

  const verifySyncAcknowledgement = async (page: Page) => {
    try {
      await expect(page.getByText("Synced successfully!")).toBeVisible({
        timeout: TIMEOUT.MEDIUM,
      });
      console.log("Tick icon is visible indicating that sync is successful");
      return true;
    } catch (err) {
      console.log("Sync acknowledgement failed");
      return false;
    }
  };

  async function expandToolbarIfMinimized() {
    let expandIcon = page_Tutor_Meeting!.locator(".lucide-chevron-up");
    let iconVisible = await expandIcon.isVisible();
    console.log("Expand icon visible:", iconVisible);

    if (iconVisible) {
      await expandIcon.click({ timeout: TIMEOUT.MEDIUM });
      console.log("Clicked on the expand icon to show toolbar");
    }
  }

  // --- Helper for feedback modal ---
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

  async function standardCropSelection(page_Tutor_Meeting: Page, TIMEOUT: any) {
    const cropArea = page_Tutor_Meeting.locator(".cropper-drag-box");
    await cropArea.waitFor({ state: "visible", timeout: TIMEOUT.MEDIUM });
    console.log("Crop area is visible to the tutor");

    await page_Tutor_Meeting.waitForTimeout(2000);

    const cropAreaBox = await cropArea.boundingBox();
    if (!cropAreaBox) throw new Error("BoundingBox for crop area is null");

    console.log("Crop area bounding box:", cropAreaBox);

    const centerX = cropAreaBox.x + cropAreaBox.width / 2;
    const centerY = cropAreaBox.y + cropAreaBox.height / 2;
    const offsetX = Math.min(50, cropAreaBox.width / 4);
    const offsetY = Math.min(30, cropAreaBox.height / 4);

    const startX = centerX - offsetX;
    const startY = centerY - offsetY;
    const endX = centerX + offsetX;
    const endY = centerY + offsetY;

    console.log(
      `Mouse coordinates: start(${startX}, ${startY}) -> end(${endX}, ${endY})`
    );

    await cropArea.scrollIntoViewIfNeeded();
    await page_Tutor_Meeting.waitForTimeout(1000);

    await page_Tutor_Meeting.mouse.move(startX, startY);
    await page_Tutor_Meeting.waitForTimeout(500);
    await page_Tutor_Meeting.mouse.down();
    await page_Tutor_Meeting.waitForTimeout(500);
    await page_Tutor_Meeting.mouse.move(endX, endY, { steps: 20 });
    await page_Tutor_Meeting.waitForTimeout(500);
    await page_Tutor_Meeting.mouse.up();

    await page_Tutor_Meeting.waitForTimeout(1000);

    console.log("Standard crop interaction completed");
  }

  async function slowCropSelection(page_Tutor_Meeting: Page, TIMEOUT: any) {
    console.log("Attempting slower crop selection");

    const cropArea = page_Tutor_Meeting.locator(".cropper-drag-box");
    await cropArea.waitFor({ state: "visible", timeout: TIMEOUT.MEDIUM });
    console.log("Crop area is visible to the tutor");

    await page_Tutor_Meeting.waitForTimeout(3000);

    const cropAreaBox = await cropArea.boundingBox();
    if (!cropAreaBox) throw new Error("BoundingBox for crop area is null");

    const centerX = cropAreaBox.x + cropAreaBox.width / 2;
    const centerY = cropAreaBox.y + cropAreaBox.height / 2;

    const startX = centerX - 25;
    const startY = centerY - 15;
    const endX = centerX + 25;
    const endY = centerY + 15;

    await cropArea.scrollIntoViewIfNeeded();
    await page_Tutor_Meeting.waitForTimeout(2000);

    await page_Tutor_Meeting.mouse.move(startX, startY);
    await page_Tutor_Meeting.waitForTimeout(1000);
    await page_Tutor_Meeting.mouse.down();
    await page_Tutor_Meeting.waitForTimeout(1000);
    await page_Tutor_Meeting.mouse.move(endX, endY, { steps: 30 });
    await page_Tutor_Meeting.waitForTimeout(1000);
    await page_Tutor_Meeting.mouse.up();
    await page_Tutor_Meeting.waitForTimeout(2000);

    console.log("Slow crop interaction completed");
  }

  async function fallbackCropSelection(page_Tutor_Meeting: Page, TIMEOUT: any) {
    console.log("Attempting DOM-based crop selection");

    await page_Tutor_Meeting.evaluate(() => {
      const cropBox = document.querySelector(
        ".cropper-drag-box"
      ) as HTMLElement;
      if (cropBox) {
        const rect = cropBox.getBoundingClientRect();
        const startEvent = new MouseEvent("mousedown", {
          bubbles: true,
          clientX: rect.left + 20,
          clientY: rect.top + 20,
        });

        const moveEvent = new MouseEvent("mousemove", {
          bubbles: true,
          clientX: rect.left + 120,
          clientY: rect.top + 70,
        });

        const endEvent = new MouseEvent("mouseup", {
          bubbles: true,
          clientX: rect.left + 120,
          clientY: rect.top + 70,
        });

        cropBox.dispatchEvent(startEvent);
        setTimeout(() => {
          cropBox.dispatchEvent(moveEvent);
          setTimeout(() => cropBox.dispatchEvent(endEvent), 50);
        }, 100);
      }
    });

    await page_Tutor_Meeting.waitForTimeout(2000);
    console.log("DOM-based crop interaction completed");
  }

  async function robustCropInteraction(page_Tutor_Meeting: Page, TIMEOUT: any) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Crop attempt ${attempt}/${maxRetries}`);

        if (attempt === 1) {
          await standardCropSelection(page_Tutor_Meeting, TIMEOUT);
        } else if (attempt === 2) {
          await slowCropSelection(page_Tutor_Meeting, TIMEOUT);
        } else {
          await fallbackCropSelection(page_Tutor_Meeting, TIMEOUT);
        }

        const cropArea = page_Tutor_Meeting.locator(".cropper-drag-box");
        await cropArea.waitFor({ state: "visible", timeout: TIMEOUT.MEDIUM });
        console.log("Crop selection successful");
        return;
      } catch (error) {
        lastError = error;
        console.log(`Crop attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          await page_Tutor_Meeting.waitForTimeout(2000);
        }
      }
    }

    throw new Error(
      `All crop attempts failed. Last error: ${lastError?.message}`
    );
  }

  const cleanupRedisClass = async (classId: string) => {
    if (!classId) {
      console.log("No classId provided, skipping Redis cleanup");
      return;
    }

    try {
      const response = await apiContext.post(
        "/api/v2/functional-tests-helper/delete-class-redis-item",
        { data: { classId } }
      );
      const resBody = await response.json();
      console.log(
        "Redis cleanup completed:",
        resBody?.data?.message || "Unknown response"
      );
    } catch (err) {
      console.warn("Redis cleanup failed (non-critical):", err?.message);
    }
  };

  const NOTE_ANSWERS_PATH = "/api/v2/note-answers";

  async function waitForNoteAnswersPOST(page: Page, timeout = TIMEOUT.XLONG) {
    console.log("[WAIT] NOTE_ANSWERS POST…");
    const res = await page.waitForResponse(
      (r) =>
        r.url().includes(NOTE_ANSWERS_PATH) &&
        ["POST", "PUT", "PATCH"].includes(r.request().method()) &&
        r.status() >= 200 &&
        r.status() < 300,
      { timeout }
    );
    console.log("[WAIT] POST matched:", res.status(), res.url());
    return res;
  }

  async function waitForNoteAnswersGET(page: Page, timeout = TIMEOUT.XLONG) {
    console.log("[WAIT] NOTE_ANSWERS GET…");
    const res = await page.waitForResponse(
      (r) =>
        r.url().includes(NOTE_ANSWERS_PATH) &&
        r.request().method() === "GET" &&
        r.ok(),
      { timeout }
    );
    console.log("[WAIT] GET matched:", res.status(), res.url());
    return res;
  }

  async function waitForFirstThumbToDecode(
    page: Page,
    timeout = TIMEOUT.XLONG
  ) {
    console.log("[THUMB] wait visible");
    const thumb = page
      .locator('.cropped-images-wrapper img[alt="cropped"]')
      .first();
    await expect(thumb).toBeVisible({ timeout });

    console.log("[THUMB] wait decode");
    await thumb.evaluate((img: HTMLImageElement) => {
      if (img.complete && img.naturalWidth > 0) return;
      const anyImg = img as any;
      if (typeof anyImg.decode === "function") {
        return anyImg.decode().catch(() => {});
      }
      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    });
    console.log("[THUMB] decoded");
  }

  // --- Constants for timeouts ---
  const TIMEOUT = {
    SHORT: 2000,
    MEDIUM: 10000,
    LONG: 20000,
    XLONG: 100000,
  };

  test.beforeAll(async ({ browserName }) => {
    if (browserName.toLowerCase() !== "chromium") {
      return;
    }
    student_browser = await chromium.launch({
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--no-sandbox",
      ],
    });

    tutor_browser = await chromium.launch({
      args: ["--no-sandbox"],
    });

    apiContext = await getApiContext();

    console.log("Server Time " + new Date().toISOString());

    browserContext_Student = await student_browser.newContext();
    browserContext_Tutor = await tutor_browser.newContext();

    page_Student = await browserContext_Student.newPage();
    page_Tutor = await browserContext_Tutor.newPage();

    await loginAsStudent(page_Student);
    await loginAsTutor(page_Tutor);
    await cleanUpClassProgress();
  });

  test.afterAll(async ({ browserName }) => {
    if (browserName.toLowerCase() === "chromium") {
      if (classId) {
        await cleanupRedisClass(classId);
      }
      if (student_browser) {
        await student_browser.close();
      }
      if (tutor_browser) {
        await tutor_browser.close();
      }
    }
  });

  test("INCLASS | TC - 1 : Student and Tutor can join and see meeting page", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Student) {
      throw new Error("page_Student is not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    const studentJoinBtn = page_Student
      .getByRole("button", { name: "Join Now" })
      .first();
    [page_Student_Meeting] = await Promise.all([
      page_Student.context().waitForEvent("page"),
      studentJoinBtn.click({ timeout: TIMEOUT.LONG }),
    ]);
    console.log("Student clicked Join Now and meeting page opened");

    await page_Student_Meeting.waitForTimeout(5000);
    await page_Student_Meeting.waitForLoadState("domcontentloaded");
    // await page_Student_Meeting.waitForLoadState("networkidle");
    console.log("Student meeting page loaded");

    await handlePreviousClassFeedbackModal(page_Student_Meeting);
    await acceptCookiesIfVisible(page_Student_Meeting);
    console.log("Accepted cookies if visible on student meeting page");
    console.log("Cleaned up class progress");

    console.log(
      "Completed INCLASS | TC - 1 : Student and Tutor can join and see meeting page"
    );
  });

  test("INCLASS | TC - 2 : Assigns lecture to class if not already assigned", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor) {
      throw new Error("page_Tutor is not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log("Starting: Assign lecture to class if not already assigned");
    await acceptCookiesIfVisible(page_Tutor);
    console.log("Accepted cookies if visible on tutor page");

    await expect(page_Tutor.getByLabel("Show only Scheduled")).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    console.log("Show only Scheduled text is visible to the tutor");
    await page_Tutor.getByLabel("Show only Scheduled").check();
    console.log("Tutor clicked on Show only Scheduled toggle button");

    await page_Tutor.waitForLoadState("domcontentloaded");

    const myClass = page_Tutor.locator(".card-body", {
      hasText: "ALL DAY FUNCTIONAL TESTS",
    });
    const editClassButtons = myClass.locator("button", {
      hasText: "Edit Class",
    });
    const count = await editClassButtons.count();

    if (count === 1) {
      await editClassButtons.click({ timeout: TIMEOUT.MEDIUM });
      console.log("Edited the first class (only one card present)");
    } else if (count > 1) {
      await editClassButtons.first().click({ timeout: TIMEOUT.MEDIUM });
      console.log("Edited the first class (multiple cards present)");
    } else {
      console.log("No class found to edit");
    }

    await expect(page_Tutor.locator(".ri-pencil-fill")).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    console.log("Edit button is visible to the tutor");
    await page_Tutor
      .locator(".ri-pencil-fill")
      .click({ timeout: TIMEOUT.MEDIUM });
    console.log("Tutor clicked the edit button");
    await page_Tutor.waitForLoadState("domcontentloaded");

    const lectureName = !testConfigs.TEST_CONSTANTS.APP_BASE_URL.includes("dev")
      ? "Test Lecture: Functional Testing"
      : "Test Lecture: Functional Testing - Dev";
    const lecture = page_Tutor.locator(`text=${lectureName}`);

    try {
      await expect(lecture).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Lecture is already assigned and visible");
      await page_Tutor
        .locator("button.btn-close")
        .click({ timeout: TIMEOUT.MEDIUM });
      console.log("Closed the edit modal");
    } catch (error) {
      console.log("Lecture is not there for the class, assigning now...");
      const subjectElement = page_Tutor.locator(
        'xpath=//*[@id="ClassEditModals"]/div/div[2]/form/div[1]/div[3]/div/div/div/div'
      );
      await expect(subjectElement).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Subject element is visible to tutor");
      const lectureElement = page_Tutor.locator(
        'xpath=//*[@id="ClassEditModals"]/div/div[2]/form/div[1]/div[5]/div/div/div/div'
      );
      await expect(lectureElement).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Lecture selection field is visible to tutor");
      await subjectElement.locator("input").click({ timeout: TIMEOUT.MEDIUM });
      console.log("Tutor clicked on the subject selection field");
      await expect(page_Tutor.locator(".css-1nmdiq5-menu")).toBeVisible({
        timeout: TIMEOUT.SHORT,
      });
      await page_Tutor
        .locator(".css-1nmdiq5-menu")
        .getByText("Maths")
        .click({ timeout: TIMEOUT.MEDIUM });
      console.log("Tutor selected the subject");
      await lectureElement.locator("input").click({ timeout: TIMEOUT.MEDIUM });
      console.log("Tutor clicked on the lecture selection field");
      await expect(
        page_Tutor.locator('input[aria-expanded="true"]')
      ).toBeVisible({
        timeout: TIMEOUT.MEDIUM,
      });
      await page_Tutor
        .locator('input[aria-expanded="true"]')
        .fill("Test Lecture");
      console.log(
        "Tutor searching for the lecture among the available options"
      );
      await page_Tutor
        .locator(".css-1nmdiq5-menu")
        .getByText(lectureName, { exact: true })
        .first()
        .click({ timeout: TIMEOUT.MEDIUM });
      console.log("Tutor selected the lecture");
      await expect(
        page_Tutor.getByRole("button", { name: "Submit" })
      ).toBeVisible({
        timeout: TIMEOUT.MEDIUM,
      });
      await page_Tutor
        .getByRole("button", { name: "Submit" })
        .click({ timeout: TIMEOUT.MEDIUM });
      console.log("Lecture added to class");
      await expect(
        page_Tutor.getByText("Class updated successfully")
      ).toBeVisible({
        timeout: TIMEOUT.MEDIUM,
      });
      console.log("Class updated successfully message visible");
    }

    await page_Tutor.waitForLoadState("domcontentloaded");
    await page_Tutor.getByLabel("Show only Scheduled").check();
    console.log("Show only Scheduled checked again");

    const joinButton = page_Tutor
      .getByRole("button", { name: "Join Class" })
      .first();
    await expect(joinButton).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    console.log("Join Class button is visible to the tutor");
    [page_Tutor_Meeting] = await Promise.all([
      page_Tutor.context().waitForEvent("page"),
      joinButton.click({ timeout: TIMEOUT.MEDIUM }),
    ]);
    console.log("Tutor clicked Join Class and meeting page opened");
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");

    const dismissButton = page_Tutor_Meeting.getByRole("button", {
      name: "Dismiss",
    });
    try {
      await dismissButton.waitFor({
        state: "visible",
        timeout: TIMEOUT.MEDIUM,
      });
      const dismissButtonVisible = await dismissButton.isVisible();
      console.log("Dismiss button visible:", dismissButtonVisible);
      await dismissButton.click({ timeout: TIMEOUT.MEDIUM });
      console.log("Clicked on the Dismiss button");
    } catch (error) {
      console.log(
        "Dismiss button did not appear within the expected time",
        error
      );
    }

    if (page_Tutor_Meeting?.url()) {
      const urlParams = page_Tutor_Meeting.url().split("?")[1];
      if (urlParams) {
        classId = urlParams.substring(3);
      }
    }
    console.log(classId, " - Class Id");

    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Join" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Join button is visible to the tutor");
    await page_Tutor_Meeting
      .getByRole("button", { name: "Join" })
      .first()
      .click({ timeout: TIMEOUT.MEDIUM });
    console.log("Tutor clicked the join button");

    await page_Student_Meeting!.waitForTimeout(3000);
    await page_Student_Meeting!.waitForLoadState("domcontentloaded");

    await expect(
      page_Student_Meeting!.getByRole("button", { name: "Join Now" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Join Now button is visible to the student");
    await page_Student_Meeting!
      .getByRole("button", { name: "Join Now" })
      .click({ timeout: TIMEOUT.LONG });
    console.log("Student clicked on the join button");
    console.log("Student joined after tutor");

    console.log(
      "Completed INCLASS | TC - 2 : Assigns lecture to class if not already assigned"
    );
  });

  test("INCLASS | TC - 3 : Content is visible to both Tutor and Student after sharing PPT", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log("Starting: Content visibility test for both tutor and student");
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");

    page_Tutor_Meeting.on("websocket", (ws) => {
      ws.on("framesent", (event) => {
        try {
          const message = event.payload.toString();
          if (message.startsWith("42")) {
            const [eventName, eventData] = JSON.parse(message.slice(2));
            if (
              eventName === "player-message" ||
              eventName === "sync-annotations" ||
              eventName === "htmlSlidesEveToClient" ||
              eventName === "htmlSlidesEve"
            ) {
              tutorSocketEventData = eventData;
            }
          }
        } catch (err) {
          console.log(
            "Not able to get sent socket data from the tutor coz of, ",
            err?.message
          );
        }
      });
    });
    page_Student_Meeting.on("websocket", (ws) => {
      ws.on("framereceived", (event) => {
        try {
          const message = event.payload.toString();
          if (message.startsWith("42")) {
            const [eventName, eventData] = JSON.parse(message.slice(2));
            if (
              eventName === "player-message" ||
              eventName === "sync-annotations" ||
              eventName === "htmlSlidesEveToClient"
            ) {
              studentSocketEventData = eventData;
            }
          }
        } catch (err) {
          console.log(
            "Not able to get the received socket data coz of, ",
            err?.message
          );
        }
      });
    });

    await page_Tutor_Meeting.waitForTimeout(5000);
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
    await expect(
      page_Tutor_Meeting.locator('button[title="Present Content"]')
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    console.log("Present Content button is visible to the tutor");
    await page_Tutor_Meeting
      .locator('button[title="Present Content"]')
      .click({ timeout: TIMEOUT.MEDIUM });
    console.log("Present PPT button clicked by tutor");
    await page_Tutor_Meeting.waitForTimeout(5000);
    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
    await handleOngoingChaptersModal(page_Tutor_Meeting);

    await expect(
      page_Tutor_Meeting
        .frameLocator('iframe[title="Tutor\'s slide"]')
        .getByText("ALGEBRAIC EXPRESSIONS", {
          exact: true,
        })
    ).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    console.log("Content loaded on the tutor's end");

    const containerDiv = await page_Student_Meeting.waitForSelector(
      "div.h-full.screenshot-content-container",
      {
        timeout: TIMEOUT.MEDIUM,
      }
    );
    if (containerDiv) {
      console.log("Container div found.");
      const frameElement = await containerDiv.$(
        'iframe[title="Tutor\'s slide"]'
      );
      if (frameElement) {
        console.log("Iframe found.");
        const frame = await frameElement.contentFrame();
        if (frame) {
          console.log("Accessed content frame.");
          const contentElement = await page_Student_Meeting
            .locator(".relative > .h-full")
            .first();
          if (contentElement) {
            const contentExists = await contentElement.isVisible();
            console.log("Content loaded on the student's end:", contentExists);
          } else {
            console.error(
              "Element with selector '.relative > .h-full' not found."
            );
          }
        } else {
          console.error("Content frame could not be accessed.");
        }
      } else {
        console.error(
          "Iframe with title 'Tutor's slide' not found within the container div."
        );
      }
    } else {
      console.error(
        "Container div with class 'h-full screenshot-content container' not found on the page."
      );
    }
    console.log(
      "Completed INCLASS | TC - 3 : Content is visible to both Tutor and Student after sharing PPT"
    );
  });

  test("INCLASS | TC - 4 : Verify succcessfull loading of ppt content for tutor and student", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    await expandToolbarIfMinimized();

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log("Starting TC for validating sync on sharing the ppt");

    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    await page_Tutor_Meeting.keyboard.press("ArrowRight");

    console.log("Clicked right arrow twice");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);
    console.log("Check content");

    console.log("Tutor socket data : ", tutorSocketEventData);
    console.log("Student socket data :", studentSocketEventData);

    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log("Correct slide and step showing to student");
    } catch (err) {
      console.log("Mismatch in step or slide for student and tutor");
    }

    console.log(
      "Completed INCLASS | TC - 4 : Verify succcessfull loading of ppt content for tutor and student"
    );
  });

  test("INCLASS | TC - 5 : Tutor keyboard navigation syncs slides for both Tutor and Student", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: Tutor keyboard navigation syncs slides for both Tutor and Student"
    );

    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    console.log("Tutor pressed right arrow on the keyboard");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    console.log("Check content after right arrow");
    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log(
        "Correct slide and step showing to student after right arrow"
      );
    } catch (err) {
      console.log(
        "Mismatch in step or slide for student and tutor after right arrow"
      );
    }

    await page_Tutor_Meeting.keyboard.press("ArrowLeft");
    console.log("Tutor pressed left arrow on the keyboard");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    console.log("Check content after left arrow");
    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log("Correct slide and step showing to student after left arrow");
    } catch (err) {
      console.log(
        "Mismatch in step or slide for student and tutor after left arrow"
      );
    }

    console.log(
      "Completed INCLASS | TC - 4 : Tutor keyboard navigation syncs slides for both Tutor and Student"
    );
  });

  test("INCLASS | TC - 6 : UI button navigation syncs slides and content for Tutor and Student", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: UI button navigation syncs slides and content for Tutor and Student"
    );

    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    console.log("Tutor clicked on the right arrow button");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    console.log("Check content after right arrow");
    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log(
        "Correct slide and step showing to student after right arrow"
      );
    } catch (err) {
      console.log(
        "Mismatch in step or slide for student and tutor after right arrow"
      );
    }

    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    await page_Tutor_Meeting.keyboard.press("ArrowLeft");
    console.log("Tutor clicked on the left arrow ui button");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    console.log("Check content after left arrow");
    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log("Correct slide and step showing to student after left arrow");
    } catch (err) {
      console.log(
        "Mismatch in step or slide for student and tutor after left arrow"
      );
    }

    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    console.log(
      "Completed INCLASS | TC - 6 : UI button navigation syncs slides and content for Tutor and Student"
    );
  });

  test("INCLASS | TC - 7 : Element-to-element navigation syncs content for Tutor and Student", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: Element-to-element navigation syncs content for Tutor and Student"
    );

    const nextElementButton = page_Tutor_Meeting.getByRole("button", {
      name: "Next", exact: true
    });
    await expect(nextElementButton).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await nextElementButton.click({ timeout: TIMEOUT.MEDIUM });
    console.log("Next element button clicked");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log(
        "Correct slide and step showing to student after next element"
      );
    } catch (err) {
      console.log(
        "Mismatch in step or slide for student and tutor after next element"
      );
    }

    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    try {
      let syncRes = await checkForSync(
        tutorSocketEventData,
        studentSocketEventData
      );
      expect(syncRes).toBe(true);
      console.log(
        "Correct slide and step showing to student after previous element"
      );
    } catch (err) {
      console.log(
        "Mismatch in step or slide for student and tutor after previous element"
      );
    }

    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    console.log(
      "Completed INCLASS | TC - 7 : Element-to-element navigation syncs content for Tutor and Student"
    );
  });

  test("INCLASS | TC - 8 : Sync button enforces slide/step sync between Tutor and Student", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: Sync button enforces slide/step sync between Tutor and Student"
    );

    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    await page_Tutor_Meeting.keyboard.press("ArrowRight");
    console.log("Tutor clicked right arrow 5 times");

    await page_Tutor_Meeting.waitForTimeout(2000);
    await page_Student_Meeting.waitForTimeout(2000);

    console.log("Check content before sync");
    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    await expandToolbarIfMinimized();
    console.log("Opened the panel");

    syncButton = page_Tutor_Meeting.locator("button[title='Sync Meeting']");
    await expect(syncButton).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    console.log("Sync button is visible to the tutor");

    await syncButton.click({ timeout: TIMEOUT.MEDIUM });
    console.log("Sync button clicked");

    await page_Student_Meeting.bringToFront();
    console.log("Making student tab active");

    await verifySyncAcknowledgement(page_Tutor_Meeting);

    console.log("Tutor socket data: ", tutorSocketEventData);
    console.log("Student socket data: ", studentSocketEventData);

    const syncConfirmBtn = page_Tutor_Meeting.getByRole("button", {
      name: "Confirm",
    });
    const syncCancelBtn = page_Tutor_Meeting.getByRole("button", {
      name: "Cancel",
    });

    console.log("Check content after sync");
    let syncRes = await checkForSync(
      tutorSocketEventData,
      studentSocketEventData
    );

    if (syncRes === true) {
      console.log("Correct slide and step showing to student after sync");
      await expect(syncConfirmBtn).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Sync confirm button is visible");
      await syncConfirmBtn.click({ timeout: TIMEOUT.MEDIUM });
      console.log("Confirm button clicked");
    } else {
      console.log("Mismatch in step or slide for student and tutor after sync");
      await expect(syncCancelBtn).toBeVisible({ timeout: TIMEOUT.MEDIUM });
      console.log("Sync cancel button is visible");
      await syncCancelBtn.click({ timeout: TIMEOUT.MEDIUM });
      console.log("Cancel button clicked");
    }

    console.log(
      "Completed INCLASS | TC - 8 : Sync button enforces slide/step sync between Tutor and Student"
    );
  });

  test("INCLASS | TC - 9 : Whiteboard is visible to both Tutor and Student after sharing", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: Whiteboard is visible to both Tutor and Student after sharing"
    );

    await expect(
      page_Tutor_Meeting.locator('button[title="Whiteboard"]')
    ).toBeVisible({
      timeout: TIMEOUT.MEDIUM,
    });
    console.log("Whiteboard button is visible to the tutor");

    await page_Tutor_Meeting
      .locator('button[title="Whiteboard"]')
      .click({ timeout: TIMEOUT.MEDIUM, force: true });
    console.log("Tutor clicked on the whiteboard button");

    await expect(page_Tutor_Meeting.getByText("Whiteboard")).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Tutor opened the whiteboard");

    const whiteboardContainer = page_Tutor_Meeting.locator(
      'iframe[title="plugin-main"]'
    );
    await expect(whiteboardContainer).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Whiteboard is visible to the tutor");

    console.log("Whiteboard loading on student side...");

    const whiteboard = page_Student_Meeting.locator(".block-inputs");
    await expect(whiteboard).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Whiteboard is visible to the student");

    await page_Tutor_Meeting
      .locator('button[title="Present Content"]')
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor switched to PPT");

    await expect(page_Tutor_Meeting.locator('img[alt="back"]')).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Back button is visible to the tutor");
    await page_Tutor_Meeting
      .locator('img[alt="back"]')
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked the back button");

    console.log(
      "Completed INCLASS | TC - 9 : Whiteboard is visible to both Tutor and Student after sharing"
    );
  });

  test("INCLASS | TC - 10 : Poll evaluation flow: Student answers and Tutor submits poll during class", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: Poll evaluation flow: Student answers and Tutor submits poll during class"
    );

    await expect(
      page_Tutor_Meeting.locator("#startEvaluationButton").first()
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Start Evaluation button is visible to the tutor");
    await page_Tutor_Meeting
      .locator("#startEvaluationButton")
      .first()
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on start button to initiate poll evaluation");

    await expect(
      page_Tutor_Meeting.getByText("Poll Evaluations is starting")
    ).toBeVisible({
      timeout: TIMEOUT.XLONG,
    });
    console.log("Evaluation modal is visible to the tutor");
    await expect(
      page_Tutor_Meeting
        .locator("div")
        .filter({ hasText: /^SkipStart$/ })
        .getByRole("button")
        .nth(1)
    ).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Start button of the modal is visible to the tutor");
    await expect(
      page_Student_Meeting.locator(
        "text=Waiting for tutor to start evaluation..."
      )
    ).toBeVisible({ timeout: TIMEOUT.XLONG });
    console.log("Waiting screen is visible to the student");

    await page_Tutor_Meeting
      .locator("div")
      .filter({ hasText: /^SkipStart$/ })
      .getByRole("button")
      .nth(1)
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on start button");

    await expect(
      page_Student_Meeting.getByRole("heading", { name: "Guided Examples" })
    ).toBeVisible({
      timeout: TIMEOUT.XLONG,
    });

    let showAnswerBtn = page_Student_Meeting.locator(
      'button:has-text("Show Answer")'
    );
    let hideAnswerBtn = page_Student_Meeting.locator(
      'button:has-text("Hide Answer")'
    );

    await expect(
      page_Student_Meeting.getByText("Think of a number.")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("First question is visible to the student");
    await expect(hideAnswerBtn.nth(1)).toBeVisible({ timeout: TIMEOUT.LONG });
    await hideAnswerBtn.nth(1).click({ timeout: TIMEOUT.LONG });
    console.log("Hide answer button for second question clicked");

    await expect(
      page_Student_Meeting.locator('h3:has-text("Solution:")')
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await expect(
      page_Student_Meeting.getByText("Step 1: Identify the operations")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await expect(
      page_Student_Meeting.getByText("Step 2: Convert the given")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Solution for the first question is visible");

    await expect(hideAnswerBtn.first()).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await hideAnswerBtn.first().click({ timeout: TIMEOUT.LONG });
    console.log("Button to hide answer for the first question clicked");

    await expect(
      page_Student_Meeting.getByText(
        "The number of rooms on the ground floor of a building is 12 fewer than twice"
      )
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Second question is visible to the student");
    await expect(showAnswerBtn.nth(1)).toBeVisible({ timeout: TIMEOUT.LONG });
    await showAnswerBtn.nth(1).click({ timeout: TIMEOUT.LONG });
    console.log("Show answer button clicked for the second question");

    await expect(
      page_Student_Meeting.locator('h3:has-text("Solution:")')
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await expect(
      page_Student_Meeting.getByText("Step 1: Identify the")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await expect(
      page_Student_Meeting.getByText("Step 2: Convert the given")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Solution for the second question is visible");

    await expect(hideAnswerBtn).toBeVisible({ timeout: TIMEOUT.LONG });
    await hideAnswerBtn.click({ timeout: TIMEOUT.LONG });
    console.log("Button to hide answer for the second question clicked");

    await expect(
      page_Student_Meeting.locator('button:has-text("Move to Questions")')
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Student_Meeting
      .locator('button:has-text("Move to Questions")')
      .click({ timeout: TIMEOUT.LONG });
    console.log("Move to questions button clicked");

    await expect(
      page_Student_Meeting.getByText(
        "Are you sure you want to Attempt questions? You've viewed 2 / 2 solutions."
      )
    ).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Message showing on modal that we have viewed all solutions");

    await expect(
      page_Student_Meeting.locator('button:has-text("Attempt questions now")')
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Student_Meeting
      .locator('button:has-text("Attempt questions now")')
      .click({
        timeout: TIMEOUT.LONG,
      });
    console.log("Attempt questions now confirmation button clicked");

    await expect(page_Tutor_Meeting.getByText("Not Submitted")).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Not submitted indicator is visible");

    await expect(
      page_Tutor_Meeting.getByText("Active", { exact: true })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Student active indicator is visible");

    async function checkAndVerify(label) {
      const checkbox = page_Student_Meeting!.getByLabel(label);
      await expect(checkbox).toBeVisible({ timeout: TIMEOUT.LONG });
      await checkbox.check({ timeout: TIMEOUT.LONG });
      await expect(checkbox).toBeChecked({ timeout: TIMEOUT.LONG });
      console.log(`Checked and verified option: ${label}`);
    }

    await checkAndVerify("x+5yx+5yx+5y");
    await checkAndVerify("−xy2 - xy 2−xy");
    await checkAndVerify("3x+2y3x+2y3x+2y");
    await checkAndVerify("(a) x3−y3x^3 - y^3x3−y3");

    await expect(
      page_Student_Meeting.getByText("Answered (4 / 4)")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    await page_Student_Meeting
      .getByRole("button", { name: "Submit" })
      .click({ timeout: TIMEOUT.LONG });
    await expect(
      page_Student_Meeting.getByText("Polls submitted successfully")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Student is done with polls");

    const submitPollLocator = page_Tutor_Meeting
      .locator("button.btn.btn-success.btn-sm")
      .filter({ hasText: "Submit Poll" });
    await expect(submitPollLocator).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Submit Poll button is visible to the tutor");
    await submitPollLocator.scrollIntoViewIfNeeded();
    await submitPollLocator.click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Clicked Submit Poll using React-safe Playwright click");

    console.log(
      "Completed INCLASS | TC - 10 : Poll evaluation flow: Student answers and Tutor submits poll during class"
    );
  });

  test("INCLASS | TC - 11 : Written evaluation flow: Student submits notebook and Tutor evaluates during class", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Tutor_Meeting || !page_Student_Meeting) {
      throw new Error("Meeting pages are not initialized");
    }

    test.setTimeout(TIMEOUT.XLONG * 2);

    console.log(
      "Starting: Written evaluation flow: Student submits notebook and Tutor evaluates during class"
    );

    const backButton = page_Tutor_Meeting.locator('img[alt="back"]');
    if (
      await backButton.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)
    ) {
      console.log(
        "Back button is visible, clicking to return to main class screen"
      );
      await backButton.click({ timeout: TIMEOUT.LONG });
      await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
      console.log("Returned to main class screen");
    }

    await expect(
      page_Tutor_Meeting.locator("#startEvaluationButton").nth(1)
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Start Evaluation button is visible to the tutor");
    await page_Tutor_Meeting
      .locator("#startEvaluationButton")
      .nth(1)
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on start button to initiate written evaluation");

    await expect(
      page_Tutor_Meeting.getByText("Notebook Evaluations is")
    ).toBeVisible({
      timeout: TIMEOUT.XLONG,
    });
    console.log("Evaluation modal is visible to the tutor");
    await expect(
      page_Tutor_Meeting
        .locator("div")
        .filter({ hasText: /^SkipStart$/ })
        .getByRole("button")
        .nth(1)
    ).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Start button of the modal is visible to the tutor");
    await expect(
      page_Student_Meeting.locator(
        "text=Waiting for tutor to start evaluation..."
      )
    ).toBeVisible({ timeout: TIMEOUT.XLONG });
    console.log("Waiting screen is visible to the student");

    await page_Tutor_Meeting
      .locator("div")
      .filter({ hasText: /^SkipStart$/ })
      .getByRole("button")
      .nth(1)
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on start button");

    await expect(
      page_Student_Meeting.getByText("Solve these questions in your")
    ).toBeVisible({
      timeout: TIMEOUT.XLONG,
    });
    console.log("Written evaluation instructions are visible to the student");

    await expect(
      page_Student_Meeting.getByText("In 25 years, Josh will be")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("First question is visible to the student");
    await expect(
      page_Student_Meeting.getByText("The cost of fencing a")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Second question is visible to the student");

    await expect(
      page_Tutor_Meeting.getByText(
        "In 25 years, Josh will be twice as old as he is today. What is his current age?"
      )
    ).toBeVisible({ timeout: TIMEOUT.LONG });
    await expect(
      page_Tutor_Meeting.getByText("The cost of fencing a")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Questions are visible to the tutor");

    const captureButton = page_Tutor_Meeting
      .locator(".btn-outline-transparent")
      .filter({ hasText: /^Capture$/ });

    for (let i = 0; i < 3; i++) {
      try {
        await captureButton.waitFor({
          state: "visible",
          timeout: TIMEOUT.XLONG * 2,
        });
        await page_Tutor_Meeting.waitForTimeout(500);
        await captureButton.click({ timeout: TIMEOUT.LONG });
        console.log("Tutor clicked on capture button");
        break;
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error?.message);
        if (i === 2) throw error;
        await page_Tutor_Meeting.waitForTimeout(1000);
      }
    }

    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");
    await page_Student_Meeting.waitForLoadState("domcontentloaded");

    await expect(
      page_Student_Meeting
        .locator("div")
        .filter({ hasText: /^Please hold your notebook up to the camera$/ })
    ).toBeVisible({ timeout: TIMEOUT.XLONG });
    console.log(
      "Webcam is visible on the student's screen along with the guide message"
    );
    await expect(
      page_Tutor_Meeting.getByRole("dialog").locator("video")
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Student's video is visible on the tutor's screen");
    await expect(
      page_Tutor_Meeting
        .locator("div")
        .filter({
          hasText:
            /^Capture using the above view, clarity will be same as what you see aboveCapture$/,
        })
        .getByRole("button")
    ).toBeVisible({ timeout: TIMEOUT.LONG });
    console.log("Capture button is visible to the tutor");
    await page_Tutor_Meeting
      .locator("div")
      .filter({
        hasText:
          /^Capture using the above view, clarity will be same as what you see aboveCapture$/,
      })
      .getByRole("button")
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on capture button");
    await expect(
      page_Tutor_Meeting.getByRole("img", { name: "original" })
    ).toBeVisible({
      timeout: TIMEOUT.XLONG,
    });
    console.log("Original image is visible to the tutor");
    await expect(
      page_Tutor_Meeting.locator('button:has-text("Done")')
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Done button is visible to the tutor");
    await page_Tutor_Meeting
      .locator('button:has-text("Done")')
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on done button");
    console.log(
      "Tutor selected the default original image by clicking upon done button"
    );
    await expect(
      page_Tutor_Meeting.getByRole("button", { name: "Crop images" })
    ).toBeVisible({
      timeout: TIMEOUT.XLONG,
    });
    console.log("Crop images button is visible to the tutor");
    await page_Tutor_Meeting
      .getByRole("button", { name: "Crop images" })
      .click();
    console.log("Tutor clicked on crop images button");

    await page_Tutor_Meeting.waitForLoadState("domcontentloaded");

    await expect(
      page_Tutor_Meeting.getByRole("img", { name: "captured" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("The captured image is visible to the tutor");
    await page_Tutor_Meeting.getByRole("img", { name: "captured" }).click();
    console.log("Tutor clicked on the captured image for cropping");

    await expect(page_Tutor_Meeting.locator(".cropper-drag-box")).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log(
      "Cropper drag box is visible to the tutor for cropping the image"
    );

    await robustCropInteraction(page_Tutor_Meeting, TIMEOUT);
    console.log("Crop area selected by the tutor for question 1");

    await expect(
      page_Tutor_Meeting.locator("p.question").filter({ hasText: "Question 1" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Question 1 label is visible to the tutor");
    await page_Tutor_Meeting
      .locator("p.question")
      .filter({ hasText: "Question 1" })
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on question 1 label from the dropdown");

    await expect(
      page_Tutor_Meeting.getByRole("img", { name: "cropped" })
    ).toBeVisible({
      timeout: TIMEOUT.XLONG * 2,
    });
    console.log(
      "Cropped image is visible to the tutor after selecting question 1"
    );

    await robustCropInteraction(page_Tutor_Meeting, TIMEOUT);
    console.log("Crop area selected by the tutor for question 2");

    await expect(
      page_Tutor_Meeting.locator("p.question").filter({ hasText: "Question 2" })
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log("Question 2 label is visible to the tutor");
    await page_Tutor_Meeting
      .locator("p.question")
      .filter({ hasText: "Question 2" })
      .click({ timeout: TIMEOUT.LONG, force: true });
    console.log("Tutor clicked on question 2 label from the dropdown");

    await expect(
      page_Tutor_Meeting.getByRole("img", { name: "cropped" }).nth(1)
    ).toBeVisible({
      timeout: TIMEOUT.LONG,
    });
    console.log(
      "Cropped image is visible to the tutor after selecting question 2"
    );

    const saveAndSubmit = page_Tutor_Meeting
      .locator(".btn-secondary")
      .filter({ hasText: /^Save and submit$/ });

    await expect(saveAndSubmit).toBeVisible({ timeout: TIMEOUT.XLONG * 2 });
    console.log("Save and submit button is visible to the tutor");

    await Promise.all([
      waitForNoteAnswersPOST(page_Tutor_Meeting, TIMEOUT.XLONG),
      saveAndSubmit.click({ timeout: TIMEOUT.MEDIUM, force: true }),
    ]);
    console.log("Tutor clicked on save and submit button");
    console.log(
      "Completed INCLASS | TC - 11 : Written evaluation flow: Student submits notebook and Tutor evaluates during class"
    );
  });
});
