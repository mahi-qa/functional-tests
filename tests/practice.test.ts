import {
  test,
  expect,
  chromium,
  devices,
  Browser,
  BrowserContext,
  Page,
} from "@playwright/test";
import {
  acceptCookiesIfVisible,
  cleanupPracticeSheetCreation,
  loginAsAdmin,
} from "./helper/setup";

import moment from "moment";
import path from "path";
import { loginAsStudentPracticeSheetFT } from "./helper/practiceSheetSetup";

test.use({ storageState: "playwright/.auth/admin.json" });

const sampleImagePath = path.join(__dirname, "./fixtures/sample-image.jpg");

test.describe("Practice-Tests", () => {
  let student_browser: Browser | null = null;
  let browserContext_Student: BrowserContext | null = null;
  let page_Student: Page | null = null;
  let page_Admin: Page | null = null;

  test.beforeAll(async ({ browser, browserName }) => {
    // Skip the beforeAll setup if not running on chromium
    if (browserName.toLowerCase() !== "chromium") {
      return; // Exit early, don't set up browsers
    }
    student_browser = await chromium.launch({
      headless: true,
    });

    console.log("Server Time " + new Date().toISOString());

    page_Admin = await browser.newPage();
    await loginAsAdmin(page_Admin);
    await cleanupPracticeSheetCreation();
  });

  test.afterAll(async ({ browserName }) => {
    // Only cleanup if we're running on chromium and objects were created
    if (browserName.toLowerCase() === "chromium") {
      if (student_browser) {
        await student_browser.close();
      }
      if (page_Admin && page_Admin.context) {
        await page_Admin.context().close();
      }
    }
  });

  test("PRACTICE | TC - 1 : Assign practice sheet to the student", async ({
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

    test.setTimeout(240000);

    console.log("Starting practice sheet assignment test");
    await page_Admin.waitForLoadState("domcontentloaded");

    await expect(
      page_Admin.getByRole("link", { name: "󰋀 Home Assignments 󰅂" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Home Assignments link is visible");

    await page_Admin
      .getByRole("link", { name: "󰋀 Home Assignments 󰅂" })
      .click({ timeout: 5000 });
    console.log("Home Assignments link clicked");

    await page_Admin
      .getByRole("link", { name: "Home Assignments", exact: true })
      .click({ timeout: 5000 });
    console.log("Clicked the practice sheet link");

    await page_Admin.waitForTimeout(3000);
    await page_Admin.waitForLoadState("domcontentloaded");
    await acceptCookiesIfVisible(page_Admin);

    await expect(
      page_Admin.getByRole("button", { name: "Assign Home Assignment" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Assign practice sheet button is visible");

    await page_Admin
      .getByRole("button", { name: "Assign Home Assignment" })
      .click({ timeout: 5000 });
    console.log("Assign practice sheet button clicked");

    await page_Admin.waitForTimeout(3000);

    const nameField = page_Admin.getByLabel("Name*");
    const deadlineForSubmissionField = page_Admin.getByLabel(
      "Deadline for Submission*"
    );
    const batchField = page_Admin
      .locator("div")
      .filter({ hasText: /^Search Batch$/ })
      .nth(2);

    const subjectField = page_Admin
      .locator("div")
      .filter({ hasText: /^Search Subject$/ })
      .nth(3);
    const selectPracticeSheetField = page_Admin
      .locator("div")
      .filter({ hasText: /^Select Home Assignment$/ })
      .first();
    const tutorsSelectionField = page_Admin
      .locator("div")
      .filter({ hasText: /^Search$/ })
      .nth(3);

    await expect(nameField).toBeVisible({ timeout: 2000 });
    console.log("Name field is visible to the tutor");

    await nameField.click({ timeout: 5000 });
    console.log("Clicked the name field");
    await nameField.fill(
      `Student Maths Practice Sheet ${moment().format(
        "YYYY-MM-DD"
      )}_${moment().hour()}`
    );
    console.log("Filled the name field");

    await expect(deadlineForSubmissionField).toBeVisible({ timeout: 5000 });
    console.log("Deadline for submission field is visible");

    await deadlineForSubmissionField.click({ timeout: 5000 });
    console.log("Clicked the deadline for submission field");
    await deadlineForSubmissionField.fill(
      moment().add(7, "days").format("YYYY-MM-DD")
    );
    console.log("Deadline for submission field filled");

    await expect(subjectField.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("Subject field is visible");

    await subjectField.locator("input").click({ timeout: 5000 });
    console.log("Clicked the subject field");

    await expect(page_Admin.locator(".css-1nmdiq5-menu")).toBeVisible({
      timeout: 5000,
    });
    console.log("Subject search input is visible");

    await page_Admin
      .locator(".css-1nmdiq5-menu")
      .getByText("Maths")
      .click({ timeout: 5000 });
    console.log("Selected the subject");

    await expect(batchField.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("Batch field is visible");

    await batchField.locator("input").click({ timeout: 5000 });
    console.log("Clicked the batch field");
    await expect(page_Admin.locator('input[aria-expanded="true"]')).toBeVisible(
      { timeout: 5000 }
    );
    console.log("Batch search input is visible");
    await page_Admin
      .locator('input[aria-expanded="true"]')
      .fill("All day Functional Tests");
    console.log("Searching for the batch to assign the sheet");

    await expect(page_Admin.locator(".css-1nmdiq5-menu")).toBeVisible({
      timeout: 5000,
    });
    console.log("Batch search results are visible");

    await page_Admin
      .locator(".css-1nmdiq5-menu")
      .getByText("All day Functional Tests", { exact: true })
      .click({ timeout: 5000 });
    console.log("Selected the batch");

    await expect(selectPracticeSheetField.locator("input")).toBeVisible({
      timeout: 5000,
    });
    console.log("Practice sheet field is visible");

    await selectPracticeSheetField.locator("input").click({ timeout: 5000 });
    await selectPracticeSheetField
      .locator("input")
      .fill("Personalised Home Assignment - Simplification I");
    console.log("Searching for the practice sheet");
    await expect(page_Admin.locator(".css-1nmdiq5-menu")).toBeVisible({
      timeout: 5000,
    });
    console.log("Searching for the practice sheet");
    await page_Admin
      .locator(".css-1nmdiq5-menu")
      .getByText("Personalised Home Assignment - Simplification I")
      .click({ timeout: 5000 });
    console.log("Selected the practice sheet");

    await expect(tutorsSelectionField.locator("input")).toBeVisible({
      timeout: 5000,
    });
    console.log("Tutor selection field is visible");

    await tutorsSelectionField.locator("input").click({ timeout: 5000 });
    console.log("Clicked the tutor selection field");
    await expect(page_Admin.locator(".css-14h4o58-menu")).toBeVisible({
      timeout: 5000,
    });
    console.log("Tutor selection menu is visible");
    await page_Admin
      .locator(".css-14h4o58-menu")
      .getByText("QA Test User")
      .click({ timeout: 5000 });
    console.log("Selected the tutor");

    await expect(
      page_Admin.getByRole("button", { name: "Submit" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Submit button is visible");

    await page_Admin
      .getByRole("button", { name: "Submit" })
      .click({ timeout: 5000 });
    console.log("Clicked the submit button");
    await expect(
      page_Admin.getByText("Practice Sheet assigned successfully")
    ).toBeVisible({ timeout: 5000 });
    console.log("Completed Practice Sheet Assignment Test");

    console.log(
      "Completed PRACTICE | TC - 1 : Practice sheet assigned successfully to the student"
    );
  });

  test("PRACTICE | TC - 2 : Student Dashboard - View, Submit Practice Sheet and Verify Summary", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );

    if (!page_Student || !student_browser) {
      throw new Error("Student page or context is not initialized");
    }

    test.setTimeout(240000);

    console.log(
      "Starting test case to view practice sheet, upload image and verify summary"
    );

    const androidDevice = devices["Pixel 4"];

    browserContext_Student = await student_browser.newContext({
      ...androidDevice,
    });

    page_Student = await browserContext_Student.newPage();
    await loginAsStudentPracticeSheetFT(page_Student);
    console.log("Initialised the page for second test");

    await acceptCookiesIfVisible(page_Student);

    await expect(
      page_Student.locator("button[data-testid='flowbite-navbar-toggle']")
    ).toBeVisible({ timeout: 5000 });
    console.log("Navbar toggle button is visible");

    await page_Student
      .locator("button[data-testid='flowbite-navbar-toggle']")
      .click({ timeout: 5000 });
    console.log("Clicked the navbar toggle button");

    await expect(
      page_Student.getByText("Practice", { exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    console.log("Link for pracice sheet section is visible");

    await page_Student.getByText("Practice").first().click({ timeout: 5000 });
    console.log("Clicked the link to the practice sheet section");

    await expect(
      page_Student.getByText("Practice Papers", { exact: true })
    ).toBeVisible({ timeout: 5000 });
    console.log("Practice sheet section is visible");

    await expect(
      page_Student.locator('button:has-text("Summary")')
    ).toBeVisible({ timeout: 5000 });
    console.log("Summary button is visible");

    await expect(
      page_Student
        .locator("div")
        .filter({ hasText: /^Total Papers1$/ })
        .first()
    ).toBeVisible({ timeout: 5000 });
    console.log("Total papers count is visible");
    await expect(
      page_Student
        .locator("div")
        .filter({ hasText: /^Submitted0$/ })
        .first()
    ).toBeVisible({ timeout: 5000 });
    console.log("Submitted papers count is visible");
    await expect(
      page_Student
        .locator("div")
        .filter({ hasText: /^Not Submitted1$/ })
        .first()
    ).toBeVisible({ timeout: 5000 });
    console.log("Not submitted papers count is visible");

    await expect(
      page_Student.getByText(
        "Personalised Home Assignment - Simplification I",
        {
          exact: true,
        }
      )
    ).toBeVisible({ timeout: 5000 });
    console.log("Assigned practice sheet is visible");

    await expect(
      page_Student.getByRole("button", { name: "Start" }).first()
    ).toBeVisible({ timeout: 5000 });
    console.log("Start button is visible");

    await page_Student
      .getByRole("button", { name: "Start" })
      .first()
      .click({ timeout: 5000 });
    console.log("Clicked the start button");
    await page_Student.waitForTimeout(2000);

    const captureBtns = page_Student.getByRole("button", { name: "Capture" });
    const questionsCount = await captureBtns.count();
    console.log("Capture btn count: ", questionsCount);
    console.log("Opened the practice sheet to capture answers");

    let i = 0;

    while (i < questionsCount) {
      if (i === 0) {
        // First question: click Capture button
        await page_Student
          .getByRole("button", { name: "Capture" })
          .first()
          .click();
        console.log("Clicked Capture button for question 1");
      }

      // Expect Capture screen
      await expect(
        page_Student.getByRole("heading", { name: "Capture Your Solution" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Capture Your Solution heading is visible");

      // Take photo and upload image
      await page_Student.setInputFiles('input[type="file"]', sampleImagePath);
      console.log("Uploaded sample image for question ", i + 1);
      await page_Student.waitForTimeout(2000);

      // Verify preview of captured image
      await expect(
        page_Student.getByRole("img", { name: "Captured" })
      ).toBeVisible({ timeout: 10000 });
      console.log("Captured image is visible");

      if (i < questionsCount - 1) {
        await page_Student
          .getByRole("button", { name: "Next Question" })
          .click({ timeout: 5000 });
        console.log("Clicked Next Question button");
      } else {
        await page_Student
          .getByRole("button", { name: "Done" })
          .click({ timeout: 5000 });
        console.log("Clicked Done button");
      }

      i++;
    }

    for (let j = 0; j < questionsCount; j++) {
      await expect(
        page_Student.getByRole("button", { name: `Capture ${j + 1}` })
      ).toBeVisible({ timeout: 5000 });
      console.log(`Capture button for question ${j + 1} is visible`);
    }

    await page_Student
      .getByRole("button", { name: "Submit Practice Evaluation" })
      .click({ timeout: 5000 });
    console.log("Clicked Submit Practice Evaluation button");
    await page_Student
      .getByRole("button", { name: "Yes, submit" })
      .click({ timeout: 5000 });
    console.log("Confirmed submission of practice evaluation");

    await page_Student.waitForTimeout(3000);

    await expect(
      page_Student.locator("p").filter({ hasText: /^Submitted$/ })
    ).toBeVisible({ timeout: 5000 });
    console.log("Practice sheet submission confirmed");

    await expect(page_Student.getByText("1").nth(1)).toBeVisible({
      timeout: 5000,
    });
    console.log("Total papers count updated to 1");

    console.log(
      "Completed PRACTICE | TC - 2 : Student Dashboard - View, Submit Practice Sheet and Verify Summary"
    );
  });
});
