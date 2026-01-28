import {
  test,
  expect,
  Page,
  chromium,
  Browser,
  BrowserContext,
} from "@playwright/test";
import { cleanUpBatchCreation, loginAsAdminLighthouse } from "../helper/setup";
import moment from "moment";

test.use({ storageState: "playwright/.auth/admin.json" });

test.describe("Batch-and-Class-Creation-Tests", () => {
  let admin_browser: Browser | null = null;
  let browserContext_Admin: BrowserContext | null = null;
  let page_Admin: Page | null = null;

  test.beforeAll(async ({ browserName }) => {
    // Skip the beforeAll setup if not running on chromium
    if (browserName.toLowerCase() !== "chromium") {
      return; // Exit early, don't set up browsers
    }

    console.log("Server Time " + new Date().toISOString());

    admin_browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const testInfo = test.info(); // Get the current test info

    browserContext_Admin = await admin_browser.newContext({
      permissions: ["camera", "microphone"],
      recordVideo: {
        dir: testInfo.outputDir,
      },
    });

    page_Admin = await browserContext_Admin.newPage();

    await cleanUpBatchCreation();
    await loginAsAdminLighthouse(page_Admin);
  });

  let currentVideoPath: string | null | undefined = null;

  test.afterEach(async ({}, testInfo) => {
    // Manually attaching the video to the test report
    if (
      testInfo.title ===
      "Validating the creation of classes for the created batch"
    ) {
      if (page_Admin && page_Admin?.video()?.path()) {
        currentVideoPath = await page_Admin.video()?.path();

        testInfo.attachments.push({
          name: "video",
          contentType: "video/webm",
          path: currentVideoPath,
        });
      }
    }
  });

  test.afterAll(async ({ browserName }) => {
    // Only cleanup if we're running on chromium and objects were created
    if (browserName.toLowerCase() === "chromium") {
      if (page_Admin && page_Admin.context) {
        await page_Admin.context().close();
      }
      if (admin_browser) {
        await admin_browser.close();
      }
    }
  });

  test("BATCHES & CLASSES CREATION | TC - 1 : Creating a batch", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    // Add null check for page_Admin
    if (!page_Admin) {
      throw new Error("page_Admin is not initialized");
    }

    test.setTimeout(150000);

    console.log("Starting batch creation and editing test");
    await page_Admin.waitForLoadState("domcontentloaded");

    let batchesLink = page_Admin.locator('a:has-text("Batches")');
    await expect(batchesLink).toBeVisible({ timeout: 5000 });
    console.log("Batches link is visible");
    await batchesLink.click({ timeout: 5000 });
    console.log("Batches link clicked");

    let otherBatches = page_Admin.locator('a:has-text("Other Batches")');
    await expect(otherBatches).toBeVisible({ timeout: 5000 });
    console.log("Other Batches link is visible");
    await otherBatches.click({ timeout: 5000 });
    console.log("Other Batches link clicked");

    await expect(
      page_Admin.locator('button:has-text("Create new batch")')
    ).toBeVisible({ timeout: 5000 });
    console.log("Create new batch button is visible");
    await page_Admin
      .locator('button:has-text("Create new batch")')
      .click({ timeout: 5000 });
    console.log("Create new batch button clicked");

    let grade = page_Admin.getByText("Grade*Select Grade");
    let board = page_Admin.getByText("Board*Select Board");
    let academicYear = page_Admin.getByText(
      "Academic Year*Select Academic Year"
    );
    let startDate = page_Admin.locator('div[aria-label="Start Date"]');
    let endDate = page_Admin.locator('div[aria-label="End Date"]');
    let startTime = page_Admin.locator('div[aria-label="Start Time"]');
    let endTime = page_Admin.locator('div[aria-label="End Time"]');

    let school = page_Admin
      .locator("div")
      .filter({ hasText: /^Select School$/ })
      .nth(2);

    let students = page_Admin
      .locator("div")
      .filter({ hasText: /^Select Students$/ })
      .nth(2);

    let book = page_Admin.getByText("Book*Select Book");
    let tutors = page_Admin.getByText("Tutors*Select Tutors");

    await expect(page_Admin.getByPlaceholder("Enter here...")).toBeVisible({
      timeout: 5000,
    });
    console.log("Placeholder input field is visible");
    await page_Admin.getByPlaceholder("Enter here...").click();
    console.log("Clicked on the placeholder input field");
    await page_Admin.getByPlaceholder("Enter here...").fill("QA test batch");
    console.log("Filled batch name");

    await expect(grade.locator('input[tabindex="0"]')).toBeVisible({
      timeout: 5000,
    });
    console.log("Grade field is visible");
    await grade.locator('input[tabindex="0"]').click({ timeout: 5000 });
    console.log("Clicked on the grade field");
    await expect(page_Admin.getByRole("option", { name: "6" })).toBeVisible({
      timeout: 5000,
    });
    console.log("Grade 6 option is visible");
    await page_Admin
      .getByRole("option", { name: "6" })
      .click({ timeout: 5000 });
    console.log("Selected grade");

    await expect(startDate).toBeVisible({ timeout: 5000 });
    console.log("Start date field is visible");
    await startDate.click({ timeout: 5000 });
    console.log("Clicked on the Start date field");
    await startDate
      .getByLabel("month, Start Date")
      .fill(String(moment().month() + 1));
    console.log("Filled start date month");
    await startDate.getByLabel("day, Start Date").fill(String(moment().date()));
    console.log("Filled start date day");
    await startDate
      .getByLabel("year, Start Date")
      .fill(String(moment().year()));
    console.log("Filled start date year");

    await expect(endDate).toBeVisible({ timeout: 5000 });
    console.log("End date field is visible");
    await endDate.click({ timeout: 5000 });
    console.log("Clicked on the End date field");
    const endMoment = moment().add(1, "day");
    await endDate
      .getByLabel("month, End Date")
      .fill(String(endMoment.month() + 1));
    console.log("Filled end date month");
    await endDate.getByLabel("day, End Date").fill(String(endMoment.date()));
    console.log("Filled end date day");
    await endDate.getByLabel("year, End Date").fill(String(endMoment.year()));
    console.log("Filled end date year");

    await expect(startTime).toBeVisible({ timeout: 5000 });
    console.log("Start time field is visible");
    await startTime.click({ timeout: 5000 });
    console.log("Clicked on the Start time field");
    await startTime.getByLabel("hour, Start Time").fill("10");
    console.log("Filled start time hour");
    await startTime.getByLabel("minute, Start Time").fill("00");
    console.log("Filled start time minute");
    await startTime.getByLabel("AM/PM, Start Time").fill("AM");
    console.log("Filled start time AM/PM");

    await expect(endTime).toBeVisible({ timeout: 5000 });
    console.log("End time field is visible");
    await endTime.click({ timeout: 5000 });
    console.log("Clicked on the End time field");
    await endTime.getByLabel("hour, End Time").fill("11");
    console.log("Filled end time hour");
    await endTime.getByLabel("minute, End Time").fill("00");
    console.log("Filled end time minute");
    await endTime.getByLabel("AM/PM, End Time").fill("AM");
    console.log("Filled end time AM/PM");

    await expect(school.locator('input[tabindex="0"]')).toBeVisible({
      timeout: 5000,
    });
    console.log("School field is visible");
    await school.locator('input[tabindex="0"]').click({ timeout: 5000 });
    console.log("Clicked on the school field");
    await page_Admin
      .getByRole("option", { name: "National Public School (NPS) - JP Nagar" })
      .click({ timeout: 5000 });
    console.log("Selected school");

    await expect(students.locator('input[tabindex="0"]')).toBeVisible({
      timeout: 5000,
    });
    console.log("Students field is visible");
    await students.locator('input[tabindex="0"]').click({ timeout: 5000 });
    console.log("Clicked on the students field");
    await expect(
      page_Admin.getByRole("option", { name: "QA Admin (1090)" })
    ).toBeVisible({ timeout: 5000 });
    console.log("QA Admin (1090) option is visible");
    await page_Admin
      .getByRole("option", { name: "QA Admin (1090)" })
      .click({ timeout: 5000 });
    console.log("Selected student");

    await expect(book.locator('input[tabindex="0"]')).toBeVisible({
      timeout: 5000,
    });
    console.log("Book field is visible");
    await book.locator('input[tabindex="0"]').click({ timeout: 5000 });
    console.log("Clicked on the book field");
    await expect(
      page_Admin.getByRole("option", { name: "Bharati Bhawan RS Aggarwal" })
    ).toBeVisible({
      timeout: 5000,
    });
    console.log("Bharati Bhawan RS Aggarwal option is visible");
    await page_Admin
      .getByRole("option", { name: "Bharati Bhawan RS Aggarwal" })
      .click({ timeout: 5000 });
    console.log("Selected book");

    await expect(tutors.locator('input[tabindex="0"]')).toBeVisible({
      timeout: 5000,
    });
    console.log("Tutors field is visible");
    await tutors.locator('input[tabindex="0"]').click({ timeout: 5000 });
    console.log("Clicked on the tutors field");
    await expect(
      page_Admin.getByRole("option", { name: "QA Test User" })
    ).toBeVisible({ timeout: 5000 });
    console.log("QA Test User option is visible");
    await page_Admin
      .getByRole("option", { name: "QA Test User" })
      .click({ timeout: 5000 });
    console.log("Selected tutor");

    await expect(
      page_Admin.getByRole("button", { name: "Create Batch" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Create Batch button is visible");
    await page_Admin
      .getByRole("button", { name: "Create Batch" })
      .click({ timeout: 5000 });
    console.log("Create Batch button clicked");
    await expect(
      page_Admin.getByText("Batch created successfully")
    ).toBeVisible({ timeout: 5000 });
    console.log("Batch creation success message is visible");

    console.log(
      "Completed BATCHES & CLASSES CREATION | TC - 1 : Creating a batch"
    );
  });

  test("BATCHES & CLASSES CREATION | TC - 2 : Validating the creation of classes for the created batch", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    // Add null check for page_Admin
    if (!page_Admin) {
      throw new Error("page_Admin is not initialized");
    }

    test.setTimeout(150000);

    await expect(
      page_Admin.locator("#panel1").getByText("Batches")
    ).toBeVisible({ timeout: 5000 });
    console.log("Batches text is visible in the main menu");
    await page_Admin
      .locator("#panel1")
      .getByText("Batches")
      .click({ timeout: 5000 });
    console.log("Clicked on the text to open main menu");

    await expect(
      page_Admin.locator("a").filter({ hasText: "Classes" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Classes link is visible in the main menu");
    await page_Admin
      .locator("a")
      .filter({ hasText: "Classes" })
      .click({ timeout: 5000 });
    console.log("Clicked on the classes link");

    await expect(
      page_Admin.locator("a").filter({ hasText: "Classes Admin" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Classes Admin link is visible");
    await page_Admin
      .locator("a")
      .filter({ hasText: "Classes Admin" })
      .click({ timeout: 5000 });
    console.log("Clicked on the Classes Admin link");

    const batchOption = "QA test batch";
    const batchInput = page_Admin.locator('div[id="batches"]').locator("input");

    await expect(batchInput).toBeVisible({ timeout: 10000 });
    console.log("Batch input field is visible");
    await expect(batchInput).toBeEnabled({ timeout: 10000 });
    console.log("Batch input field is enabled");
    await batchInput.click({ timeout: 5000 });
    console.log("Clicked on the batch field");

    await batchInput.fill(batchOption);
    console.log(`Searching for the batch: ${batchOption}`);

    await page_Admin.waitForTimeout(2000);
    await page_Admin.waitForLoadState("domcontentloaded");

    // Wait for the listbox to pop-up and highlight the option
    await page_Admin
      .locator('div[id="batches"] [role="listbox"]')
      .waitFor({ state: "visible" });

    await expect(
      page_Admin.getByRole("option", { name: batchOption })
    ).toBeVisible({ timeout: 10000 });
    console.log("Option for our batch is visible in the dropdown");

    await batchInput.press("Enter");
    console.log("Selected the batch via Enter");

    await page_Admin.waitForTimeout(5000);
    await page_Admin.waitForLoadState("domcontentloaded");

    const noDataLoaded = await page_Admin
      .getByText("No records to display")
      .isVisible();
    console.log("No Data Loaded: ", noDataLoaded);
    if (noDataLoaded) {
      for (let i = 0; i < 5; i++) {
        await page_Admin.waitForTimeout(3000);
        console.log("No data loaded, clicking refresh button");
        await page_Admin
          .locator('button:has-text("Refresh")')
          .click({ timeout: 5000 });
      }
      console.log("Refresh btn clicked if classes not visible on first time");
    }

    let qaBatchClasses = page_Admin
      .getByRole("cell", { name: "QA test batch Batch ID:" })
      .first();

    await expect(qaBatchClasses).toBeVisible({ timeout: 10000 });
    console.log("QA test batch classes are visible in the table");

    console.log(
      "Completed BATCHES & CLASSES CREATION | TC - 2 : Validating the creation of classes for the created batch"
    );
  });
});
