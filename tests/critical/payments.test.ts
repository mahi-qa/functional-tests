import {
  test,
  expect,
  Page,
  BrowserContext,
  chromium,
  Browser,
  Locator,
} from "@playwright/test";
import {
  acceptCookiesIfVisible,
  cleanupTestPayment,
  loginAsAdminLighthouse,
} from "../helper/setup";
import testConfigs from "../test-configs";
import moment from "moment";

const amounts = {
  Maths: 3500,
  Science: 1500,
  Both: 4200,
};

// Updated calculation functions based on new business logic
const calcUpfrontAmount = (amount: number, day: number) => {
  let upfrontAmount;

  if (day >= 1 && day <= 7) {
    upfrontAmount = amount * 1.18;
  } else if (day >= 8 && day <= 23) {
    upfrontAmount = amount * 1.18 + 1000;
  } else if (day >= 24) {
    upfrontAmount = amount * 1.18;
  }

  return Number(upfrontAmount.toFixed());
};

const calcNextRenewalDate = (
  subscriptionDate: number,
  subscriptionMonth: number
) => {
  let renewalDate;

  if (subscriptionDate >= 1 && subscriptionDate <= 7) {
    // Renewal next month (1 month ahead)
    renewalDate = moment()
      .month(subscriptionMonth)
      .add(1, "month")
      .date(2)
      .format("MMM D, YYYY");
  } else if (subscriptionDate >= 8 && subscriptionDate <= 23) {
    // Renewal next to next month (2 months ahead)
    renewalDate = moment()
      .month(subscriptionMonth)
      .add(2, "months")
      .date(2)
      .format("MMM D, YYYY");
  } else if (subscriptionDate >= 24) {
    // Renewal next to next month (2 months ahead)
    renewalDate = moment()
      .month(subscriptionMonth)
      .add(2, "months")
      .date(2)
      .format("MMM D, YYYY");
  }

  return renewalDate;
};

const checkIfCorrectAmtsAreVisible = (
  subsAmt: string,
  upfrontAmount: string,
  expSubsAmt: string,
  expUpfAmt: number
) => {
  expect(subsAmt).toBe(expSubsAmt);
  expect(Number(upfrontAmount)).toBe(expUpfAmt);
  console.log(
    "Correct upfront and subscription amount for the selected combination"
  );
};

test.use({ storageState: "playwright/.auth/admin.json" });

test.describe("Payments-Tests", async () => {
  let admin_browser: Browser | null = null;
  let browserContext_Admin: BrowserContext | null = null;
  let page_Admin: Page | null = null;
  let page_Student: Page | null = null;
  let page_Payment: Page | null = null;
  let subscriptionDate: number | null = null;
  let subscriptionMonth: number | null = null;
  let subscriptionAmount: Locator | null = null;
  let upfrontAmount: Locator | null = null;
  let appUrl: string | null = null;

  test.beforeAll(async ({ browserName }) => {
    // Skip the beforeAll setup if not running on chromium
    if (browserName.toLowerCase() !== "chromium") {
      return; // Exit early, don't set up browsers
    }
    console.log("Server Time " + new Date().toISOString());

    await cleanupTestPayment();
    appUrl = testConfigs.TEST_CONSTANTS.APP_BASE_URL;

    admin_browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const testInfo = test.info();
    browserContext_Admin = await admin_browser.newContext({
      recordVideo: { dir: testInfo.outputDir },
    });

    page_Admin = await browserContext_Admin.newPage();
    await loginAsAdminLighthouse(page_Admin);
  });

  test.afterAll(async ({ browserName }) => {
    // Only cleanup if we're running on chromium and objects were created
    if (browserName.toLowerCase() === "chromium") {
      if (page_Admin && page_Admin.context) {
        await page_Admin.context().close();
      }
    }
    await cleanupTestPayment();
  });

  test("PAYMENTS | TC - 1 : Create a new Student", async ({ browserName }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Admin
    if (!page_Admin) {
      throw new Error("page_Admin is not initialized");
    }

    test.setTimeout(240000);

    console.log("Starting creating a student for payment test cases");

    await page_Admin.waitForLoadState("domcontentloaded");
    await expect(
      page_Admin.getByRole("link", { name: "CRM", exact: true })
    ).toBeVisible({
      timeout: 5000,
    });
    console.log("CRM link is visible");

    await page_Admin
      .getByRole("link", { name: "CRM", exact: true })
      .click({ timeout: 5000 });
    console.log("CRM link clicked");

    await acceptCookiesIfVisible(page_Admin);
    await expect(
      page_Admin.getByRole("link", { name: "All Students" })
    ).toBeVisible({ timeout: 5000 });
    console.log("All students link is visible");

    await page_Admin
      .getByRole("link", { name: "All Students" })
      .click({ timeout: 5000 });
    console.log("All students link clicked");

    await expect(
      page_Admin.getByRole("button", { name: "Add Student" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Add student button is visible");

    await page_Admin
      .getByRole("button", { name: "Add Student" })
      .click({ timeout: 5000 });
    console.log("Add student button clicked");

    await page_Admin.waitForLoadState("domcontentloaded");

    const mobileNumber = page_Admin.getByLabel("Mobile Number", {
      exact: true,
    });
    const firstName = page_Admin.getByLabel("First Name");
    const lastName = page_Admin.getByLabel("Last Name");
    const gender = page_Admin
      .locator("div")
      .filter({ hasText: /^Gender\*$/ })
      .first();
    const source = page_Admin
      .locator("div")
      .filter({ hasText: /^Source\*$/ })
      .first();
    const grade = page_Admin
      .locator("div")
      .filter({ hasText: /^Grade\*$/ })
      .first();
    const board = page_Admin
      .locator("div")
      .filter({ hasText: /^Board\*$/ })
      .first();
    const city = page_Admin
      .locator("div")
      .filter({ hasText: /^City\*$/ })
      .first();
    const school = page_Admin
      .locator("div")
      .filter({ hasText: /^School\*$/ })
      .first();

    const submitButton = page_Admin.getByRole("button", { name: "Submit" });

    await expect(mobileNumber).toBeVisible({ timeout: 5000 });
    console.log("Mobile number field is visible");

    await mobileNumber.click({ timeout: 5000 });
    console.log("Mobile number field clicked");

    await mobileNumber.fill(
      testConfigs.TEST_CONSTANTS.TEST_USER_PAYMENTS_NUMBER
    );
    console.log("Filled the student's mobile number");

    await expect(firstName).toBeVisible({ timeout: 5000 });
    console.log("First name field is visible");

    await firstName.click({ timeout: 5000 });
    console.log("First name input field clicked");

    await firstName.fill("Test");
    console.log("Entered first name of the student");

    await expect(lastName).toBeVisible({ timeout: 5000 });
    console.log("Last name field is visible");

    await lastName.click({ timeout: 5000 });
    console.log("Clicked the last name field");

    await lastName.fill("Payment");
    console.log("Entered last name of student");

    await expect(gender.locator("input[tabindex='0']")).toBeVisible({
      timeout: 5000,
    });
    console.log("Gender field is visible");

    await gender.locator("input[tabindex='0']").click({ timeout: 5000 });
    console.log("Clicked gender field");

    await expect(page_Admin.getByText("Male", { exact: true })).toBeVisible({
      timeout: 5000,
    });
    console.log("Gender option is visible");

    await page_Admin
      .getByText("Male", { exact: true })
      .click({ timeout: 5000 });
    console.log("Selected the gender");

    await expect(source.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("Source field is visible");

    await source.locator("input").click({ timeout: 5000 });
    console.log("Clicked source name field");

    await expect(
      page_Admin.getByText("Offline - GTM", { exact: true })
    ).toBeVisible({ timeout: 5000 });
    console.log("Offline - GTM option is visible");

    await page_Admin
      .getByText("Offline - GTM", { exact: true })
      .click({ timeout: 5000 });
    console.log("Selected the source");

    await expect(grade.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("Grade field is visible");

    await grade.locator("input").click({ timeout: 5000 });
    console.log("Grade field clicked");

    await expect(
      page_Admin.locator('[role="option"]', { hasText: "8" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Grade options in the dropdown menu visible");

    await page_Admin
      .locator('[role="option"]', { hasText: "8" })
      .click({ timeout: 5000 });
    console.log("Selected student's grade");

    await expect(board.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("Board field is visible");

    await board.locator("input").click({ timeout: 5000 });
    console.log("Board field clicked");

    await expect(
      page_Admin.locator('[role="option"]', { hasText: "CBSE" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Board options in the dropdown menu visible");

    await page_Admin
      .locator('[role="option"]', { hasText: "CBSE" })
      .click({ timeout: 5000 });
    console.log("Selected the board");

    await expect(city.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("City field is visible");

    await city.locator("input").click({ timeout: 5000 });
    console.log("Clicked on the city field");

    await city.locator("input").fill("Bengaluru");
    console.log("Searching for the city");

    await expect(
      page_Admin.getByText("Bengaluru (Bangalore Urban)")
    ).toBeVisible({ timeout: 10000 });
    console.log("Bengaluru (Bangalore Urban) option is visible");

    await page_Admin
      .getByText("Bengaluru (Bangalore Urban)")
      .click({ timeout: 5000 });
    console.log("Selected the city");

    await expect(school.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("School field is visible");

    await school.locator("input").click({ timeout: 5000 });
    console.log("School field clicked");

    await expect(
      page_Admin.locator('[role="option"]', {
        hasText: "National Public School (NPS) - JP Nagar",
      })
    ).toBeVisible({ timeout: 5000 });
    console.log("School options in the dropdown menu visible");

    await page_Admin
      .locator('[role="option"]', {
        hasText: "National Public School (NPS) - JP Nagar",
      })
      .click({ timeout: 5000 });
    console.log("Selected the school");

    await expect(page_Admin.getByLabel("No")).toBeVisible({ timeout: 5000 });
    console.log("Attending tutions toggle button is visible");

    await page_Admin.getByLabel("No").check();
    console.log("Clicked on the attended tutions toggle button");

    await expect(submitButton).toBeVisible({ timeout: 5000 });
    console.log("Submit button is visible");

    await submitButton.click({ timeout: 5000 });
    console.log("Clicked on the submit button");

    await expect(
      page_Admin.getByText("Student added successfully")
    ).toBeVisible({ timeout: 5000 });
    console.log("Student added successfully message is visible");

    await page_Admin.waitForLoadState("domcontentloaded");

    const studentRow = page_Admin.locator("tbody tr", {
      hasText: "Test Payment",
    });

    await expect(studentRow).toBeVisible({ timeout: 5000 });
    console.log("Student row is visible");

    const idLink = studentRow.locator("a").first();
    const studentId = await idLink.textContent();

    console.log(`Clicking on student ID: ${studentId}`);

    [page_Student] = await Promise.all([
      page_Admin.context().waitForEvent("page"),
      idLink.click({ timeout: 5000 }),
    ]);

    console.log("Redirected to the student detail page");
    await page_Student.waitForLoadState("domcontentloaded");
    console.log("Completed PAYMENTS | TC - 1 : Create a new Student");
  });

  test("PAYMENTS | TC - 2 : Create Subscription", async ({ browserName }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Student
    if (!page_Student) {
      throw new Error("page_Student is not initialized");
    }

    test.setTimeout(240000);

    console.log("Starting Creating a Subscription test case");

    await expect(
      page_Student.getByText("Subscription Details", { exact: true })
    ).toBeVisible({ timeout: 5000 });
    console.log("Subscription details tab visible");
    await page_Student
      .getByText("Subscription Details", { exact: true })
      .click({ timeout: 5000 });
    console.log("Moved to subscription details tab");

    await page_Student.waitForLoadState("domcontentloaded");

    await expect(
      page_Student.getByRole("heading", { name: "No Active Subscription" })
    ).toBeVisible({ timeout: 5000 });
    console.log("No active subscription, heading is visible");

    await expect(
      page_Student.getByRole("button", { name: "Setup Payment" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Setup payment button is visible");

    await page_Student
      .getByRole("button", { name: "Setup Payment" })
      .click({ timeout: 5000 });
    console.log("Setup payment button clicked");

    const emailField = page_Student.getByPlaceholder("Enter email");
    await expect(emailField).toBeVisible({ timeout: 5000 });
    console.log("Email field is visible");
    await emailField.click({ timeout: 5000 });
    console.log("Email field clicked");
    await emailField.fill("testP@gmail.com");
    console.log("Email entered");

    const grade = page_Student
      .locator("div")
      .filter({ hasText: /^Select a grade$/ })
      .nth(2);
    await expect(grade.locator("input")).toBeVisible({ timeout: 5000 });
    console.log("Grade field is visible");
    await grade.locator("input").click({ timeout: 5000 });
    console.log("Grade field clicked");

    await expect(
      page_Student.locator('div[role="option"]', { hasText: "8" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Grade options in the dropdown menu visible");
    await page_Student
      .locator('div[role="option"]', { hasText: "8" })
      .click({ timeout: 5000 });
    console.log("Grade selected");
    const section = page_Student.locator(
      'input[placeholder="Enter class section"]'
    );

    await expect(section).toBeVisible({ timeout: 5000 });
    console.log("Section field is visible");
    await section.click({ timeout: 5000 });
    console.log("Section field clicked");
    await section.fill("A");
    console.log("Filled the student section");
    await expect(
      page_Student.locator('button:has-text("Continue")')
    ).toBeVisible({ timeout: 5000 });
    console.log("Continue button is visible");
    await page_Student
      .locator('button:has-text("Continue")')
      .click({ timeout: 5000 });
    console.log("Clicked on continue button");
    await page_Student.waitForTimeout(2000);

    const subsStartDate = page_Student.locator(".css-hlgwow").first();
    await expect(subsStartDate).toBeVisible({ timeout: 5000 });
    console.log("Subscription start date field is visible");
    await subsStartDate.click({ timeout: 5000 });
    console.log("Subscription start date field clicked");

    await expect(page_Student.locator(".css-5736gi-menu")).toBeVisible({
      timeout: 5000,
    });
    console.log("Dropdown menu is visible");

    const dateOptions = page_Student
      .locator(".css-5736gi-menu")
      .locator("[role='option']");
    const datesCount = await dateOptions.count();

    console.log("Options count - ", datesCount);
    subscriptionDate = 0;
    subscriptionMonth = 0;

    for (let i = 0; i < datesCount; i++) {
      let value = await dateOptions.nth(i).textContent();

      console.log("Value :", value);
      const dateString = value?.split(" ")?.slice(0, 3).join(" ");
      const date = moment(dateString, "DD MMM, YYYY");

      if (i === 0) {
        subscriptionDate = date.date();
        subscriptionMonth = date.month();
      }

      expect(
        date.day() === 1 || date.day() === 3 || date.day() === 5
      ).toBeTruthy();
      console.log(`Option ${i} is Monday or Wednesday or Friday`);
    }

    console.log(
      "Verified if all subscription start date are Mondays or Wednesdays or Fridays"
    );

    await expect(
      page_Student
        .locator('div[role="listbox"]')
        .locator('[role="option"]')
        .first()
    ).toBeVisible({ timeout: 5000 });
    console.log("First subscription start date option is visible");
    await page_Student
      .locator('div[role="listbox"]')
      .locator('[role="option"]')
      .first()
      .click({ timeout: 5000 });
    console.log("Selected the first subscription start date");

    const requestForBatchBtn = page_Student.locator(
      'button:has-text("Request for new batch")'
    );

    try {
      await expect(requestForBatchBtn).toBeVisible({ timeout: 5000 });
      console.log("Button to request for the batch is visible");

      await requestForBatchBtn.click({ timeout: 5000 });
      console.log("Button to request for the batch clicked");

      const buttonsToRequest = page_Student
        .locator("button")
        .filter({ hasText: /^Request$/ });
      const btnCount = await buttonsToRequest.count();

      for (let i = 0; i < btnCount; i++) {
        try {
          await buttonsToRequest.nth(i).click({ timeout: 5000 });
          console.log("Clicked on the request button to request for batch");
          await expect(
            page_Student.getByText("Requested batch successfully created")
          ).toBeVisible({ timeout: 5000 });
          console.log(
            "Successfully requested for the batch toast notifier visible"
          );
        } catch (er) {
          if (i === btnCount - 1) {
            console.log("Failed to request for the batch");
          }
        }
      }
    } catch (er) {
      console.log("Already requested for the batch");
    }

    const preferredTimeSlots = page_Student.getByText(
      "Available Batches *Select"
    );

    try {
      await expect(preferredTimeSlots.locator("input")).toBeVisible({
        timeout: 5000,
      });
      await preferredTimeSlots.locator("input").click({ timeout: 5000 });

      const availableBatches = page_Student
        .locator(".css-5736gi-menu")
        .locator('[role="option"]');
      const batchesCount = await availableBatches?.count();
      let batchSelected = false;

      for (let i = 0; i < batchesCount; i++) {
        const disabled = await availableBatches.nth(i).isDisabled();

        if (!disabled) {
          await availableBatches.nth(i).click({ timeout: 5000 });
          console.log("Selected the first available class");
          batchSelected = true;
          break;
        }
      }

      // Clicking outside the menu so that the dropdown gets closed if it's open
      await page_Student
        .getByText("Available Batches *")
        .click({ timeout: 5000 });
    } catch (err) {
      console.log(
        "Available batches dropdown not visible or not able to select available batch"
      );
    }

    upfrontAmount = page_Student.locator('input[name="upfrontAmount"]');
    subscriptionAmount = page_Student.locator(
      'input[name="subscriptionAmount"]'
    );
    let amount = 0;
    let upfAmount = 0;
    let value = await subscriptionAmount.inputValue();
    let displayedUpfAmount = await upfrontAmount.inputValue();

    console.log("dayOfMonth:", subscriptionDate);
    console.log(
      "Verifying if correct upfront amount and subscription amount appears for different selections of batch size and subjects"
    );

    // Updated amount validation logic
    amount = amounts["Both"];
    upfAmount = calcUpfrontAmount(amount, subscriptionDate);
    console.log("Calculated upfront amount:", upfAmount);

    await page_Student.waitForTimeout(2000);
    value = await subscriptionAmount.inputValue();
    displayedUpfAmount = await upfrontAmount.inputValue();

    // Determine expected amounts based on subscription date
    let expectedSubscriptionAmount = "4956";
    let expectedUpfrontAmount = upfAmount;

    console.log(
      `Date: ${subscriptionDate}, Expected subscription: ${expectedSubscriptionAmount}, Expected upfront: ${expectedUpfrontAmount}`
    );
    console.log(
      `Displayed subscription: ${value}, Displayed upfront: ${displayedUpfAmount}`
    );

    checkIfCorrectAmtsAreVisible(
      value,
      displayedUpfAmount,
      expectedSubscriptionAmount,
      expectedUpfrontAmount
    );
    console.log("Correct upfront amount and subscription amount are visible");

    await expect(page_Student.getByText("Manual Payment")).toBeVisible({
      timeout: 5000,
    });
    console.log("Radio button to select manual payment is visible");

    await page_Student.getByText("Manual Payment").click({ timeout: 5000 });
    console.log("Radio button to select Manual Payment clicked");

    await expect(
      page_Student.getByRole("button", { name: "Create Subscription" })
    ).toBeVisible({ timeout: 10000 });
    console.log("Create subscription button is visible");

    await page_Student
      .getByRole("button", { name: "Create Subscription" })
      .click({ timeout: 10000 });
    console.log("Create subscription button clicked");

    await expect(page_Student.getByText("PAYMENT_INITIATED")).toBeVisible({
      timeout: 10000,
    });
    console.log("Payment Initiated status is visible");

    await expect(page_Student.getByText("Full Subscription")).toBeVisible({
      timeout: 5000,
    });
    console.log("Full Subscription badge is visible");
    await page_Student.reload();
    await page_Student.waitForLoadState("domcontentloaded");

    console.log("Completed PAYMENTS | TC - 2 : Create Subscription");
  });

  test("PAYMENTS | TC - 3 : Make payment on Razorpay", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Student
    if (!page_Student) {
      throw new Error("page_Student is not initialized");
    }

    test.setTimeout(240000);

    console.log("Starting Making Payment on Razorpay test case");

    const paymentLink = page_Student.getByRole("button", {
      name: "Payment Link",
    });

    await expect(paymentLink).toBeVisible({ timeout: 5000 });
    console.log("Payment link is visible");

    [page_Payment] = await Promise.all([
      page_Student.context().waitForEvent("page"),
      paymentLink.click({ timeout: 5000 }),
    ]);
    console.log("Getting re-directed to the payment page");

    await expect(
      page_Payment
        .frameLocator("#checkout-parent iframe")
        .getByPlaceholder("Mobile number")
    ).toBeVisible({ timeout: 15000 });
    console.log("Mobile number field in Razorpay is visible");
    await page_Payment
      .frameLocator("#checkout-parent iframe")
      .getByPlaceholder("Mobile number")
      .click({ timeout: 5000 });
    console.log("Clicked on the mobile number field in Razorpay");
    await page_Payment
      .frameLocator("#checkout-parent iframe")
      .getByPlaceholder("Mobile number")
      .fill(testConfigs.TEST_CONSTANTS.TEST_USER_PAYMENTS_NUMBER);
    console.log("Filled mobile number for payment");

    await expect(
      page_Payment
        .frameLocator("#checkout-parent iframe")
        .getByRole("button", { name: "Continue" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Continue button is visible");

    await page_Payment
      .frameLocator("#checkout-parent iframe")
      .getByRole("button", { name: "Continue" })
      .click({ timeout: 5000 });
    console.log("Clicked on the continue button");

    await expect(
      page_Payment.frameLocator("#checkout-parent iframe").getByText("UPI")
    ).toBeVisible({ timeout: 5000 });
    console.log("UPI option is visible for payment");
    await page_Payment
      .frameLocator("#checkout-parent iframe")
      .getByText("UPI")
      .click({ timeout: 5000 });
    console.log("UPI option selected for payment");

    await expect(
      page_Payment
        .frameLocator("iframe >> nth=0")
        .getByPlaceholder("example@okhdfcbank")
    ).toBeVisible({ timeout: 5000 });
    console.log("Field to enter email for payment is visible");

    await page_Payment
      .frameLocator("iframe >> nth=0")
      .getByPlaceholder("example@okhdfcbank")
      .click({ timeout: 5000 });
    console.log("Clicked on the email field for payment");
    await page_Payment
      .frameLocator("iframe >> nth=0")
      .getByPlaceholder("example@okhdfcbank")
      .fill("success@razorpay");
    console.log("Email filled for payment");

    await expect(
      page_Payment
        .frameLocator("iframe >> nth=0")
        .getByRole("button", { name: "Continue" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Continue button is visible");

    await page_Payment
      .frameLocator("iframe >> nth=0")
      .getByRole("button", { name: "Continue" })
      .click({ timeout: 5000 });
    console.log("Clicked on the continue button");

    console.log("Waiting for payment to be processed");
    await page_Payment.waitForTimeout(20000);

    console.log("Completed PAYMENTS | TC - 3 : Make payment on Razorpay");
  });

  test("PAYMENTS | TC - 4 : Check change of status on lighthouse", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Student
    if (!page_Student) {
      throw new Error("page_Student is not initialized");
    }

    test.setTimeout(240000);

    console.log(
      "Starting Test for Verifying the status on Lighthouse after Enrolling"
    );

    await page_Student.reload();
    console.log("Reloaded the page");

    await expect(
      page_Student.getByText("Enrolled", { exact: true }).first()
    ).toBeVisible({ timeout: 10000 });
    console.log("Correct status (Enrolled) showing for student after payment");

    await expect(page_Student.getByText("Paid - Manual Pay")).toBeVisible({
      timeout: 10000,
    });
    console.log("Paid using Manual Pay text is visible");

    // Check next due date using updated logic
    const nextDueDate = calcNextRenewalDate(
      subscriptionDate!,
      subscriptionMonth!
    );
    console.log("Next due date : ", nextDueDate);

    await expect(page_Student.getByText(nextDueDate)).toBeVisible({
      timeout: 5000,
    });
    console.log("Correct next due date is visible");

    console.log(
      "Completed PAYMENTS | TC - 4 : Check change of status on lighthouse"
    );
  });

  test("PAYMENTS | TC - 5 : Checking the status on Payment tracker", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Admin
    if (!page_Admin) {
      throw new Error("page_Admin is not initialized");
    }

    test.setTimeout(240000);

    console.log(
      "Starting Test for Checking the status on Payment Tracker after Enrolling"
    );

    await expect(page_Admin.getByText("CRM")).toBeVisible({ timeout: 5000 });
    console.log("CRM link is visible");
    await page_Admin.getByText("CRM").click({ timeout: 5000 });
    console.log("Clicked on the CRM link");
    console.log("Closed the already opened All Students Dashboard");

    await expect(
      page_Admin.getByRole("link", { name: "CRM", exact: true })
    ).toBeVisible({
      timeout: 5000,
    });
    console.log("CRM link is visible");
    await page_Admin
      .getByRole("link", { name: "CRM", exact: true })
      .click({ timeout: 5000 });
    console.log("Clicked on the CRM link");
    await expect(
      page_Admin.getByRole("link", { name: "Payment Tracker" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Payment tracker link is visible");
    await page_Admin
      .getByRole("link", { name: "Payment Tracker" })
      .click({ timeout: 5000 });
    console.log("Clicked on the payment tracker link");

    await expect(page_Admin.locator(".css-19bb58m").first()).toBeVisible({
      timeout: 5000,
    });
    console.log("Payment tracker search field is visible");
    await page_Admin.locator(".css-19bb58m").first().click({ timeout: 5000 });
    console.log("Clicked on the payment tracker search field");
    await page_Admin
      .locator(".css-19bb58m")
      .first()
      .locator("input")
      .fill("Test");
    console.log("Filled the search field with Test");
    await expect(
      page_Admin.getByRole("option", { name: "Test Payment" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Test Payment option is visible in the dropdown");
    await page_Admin
      .getByRole("option", { name: "Test Payment" })
      .click({ timeout: 5000 });
    console.log("Clicked on the Test Payment option");

    const studentRow = page_Admin.locator(`tbody tr`, {
      hasText: "Test Payment",
    });

    await expect(studentRow.getByText("Enrolled")).toBeVisible({
      timeout: 5000,
    });
    console.log("Correct status showing on payment tracker");

    console.log(
      "Completed PAYMENTS | TC - 5 : Checking the status on Payment tracker after Enrolling"
    );
  });

  test("PAYMENTS | TC - 6 : Cancelling Subscription", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Student
    if (!page_Student) {
      throw new Error("page_Student is not initialized");
    }

    test.setTimeout(240000);

    console.log("Starting TC for Cancelling Subscription");

    await expect(
      page_Student.getByRole("button", { name: "Cancel Subscription" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Cancel subscription button is visible");
    await page_Student
      .getByRole("button", { name: "Cancel Subscription" })
      .click({ timeout: 5000 });
    console.log("Cancel subscription button clicked");

    await expect(
      page_Student.getByPlaceholder("Enter reason for cancellation")
    ).toBeVisible({ timeout: 5000 });
    console.log("Placeholder to enter reason for cancellation is visible");
    await page_Student
      .getByPlaceholder("Enter reason for cancellation")
      .click({ timeout: 5000 });
    console.log("Clicked on the placeholder to enter reason for cancellation");
    await page_Student
      .getByPlaceholder("Enter reason for cancellation")
      .fill("Student is not well");
    console.log("Entered the reason for cancellation of subscription");

    await expect(
      page_Student.getByRole("button", { name: "Submit" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Submit button is visible");
    await page_Student
      .getByRole("button", { name: "Submit" })
      .click({ timeout: 5000 });
    console.log("Cancelled the subscription");

    await expect(page_Student.getByRole("button", { name: "Yes" })).toBeVisible(
      { timeout: 5000 }
    );
    console.log("Button to confirm cancelling subscription is visible");
    await page_Student
      .getByRole("button", { name: "Yes" })
      .click({ timeout: 5000 });
    console.log("Clicked on the Confirm button to cancel subscription");

    await expect(
      page_Student.getByText("Subscription cancelled successfully")
    ).toBeVisible({ timeout: 5000 });
    console.log("Subscription cancelled successfully text is visible");

    await expect(
      page_Student.getByRole("button", { name: "Restart Subscription" })
    ).toBeVisible({ timeout: 10000 });
    console.log(
      "Restart subscription button is visible after cancelling the subscription"
    );
    console.log("Completed PAYMENTS | TC - 6 : Cancelling Subscription");
  });

  test("PAYMENTS | TC - 7 : Re-initiate subscription", async ({
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium" ||
        !appUrl?.includes("dev") ||
        (moment().hour() > 10 && moment().hour() < 20),
      `Test only for Chromium!`
    );

    // Add null check for page_Student
    if (!page_Student) {
      throw new Error("page_Student is not initialized");
    }

    test.setTimeout(240000);

    console.log("Starting Re-initiate Payment test case");

    await expect(
      page_Student.getByRole("button", { name: "Re-initiate Payment" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Re-initiate payment button visible");
    await page_Student
      .getByRole("button", { name: "Re-initiate Payment" })
      .click({ timeout: 5000 });
    console.log("Re-initiate payment clicked");

    await expect(page_Student.getByRole("button", { name: "Yes" })).toBeVisible(
      { timeout: 5000 }
    );
    console.log("Button named yes is visible");
    await page_Student
      .getByRole("button", { name: "Yes" })
      .click({ timeout: 5000 });
    console.log("Button named yes clicked");

    await expect(page_Student.getByLabel("Manual Payment")).toBeVisible({
      timeout: 5000,
    });
    console.log("Manual payment radio button is visible");
    await page_Student.getByLabel("Manual Payment").click({ timeout: 5000 });
    console.log("Manual payment radio button clicked");

    await expect(
      page_Student.getByRole("button", { name: "Create" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Create subscription button is visible");
    await page_Student
      .getByRole("button", { name: "Create" })
      .click({ timeout: 5000 });
    console.log("Create subscription button clicked");

    await expect(
      page_Student.getByText("Payment re-initiated successfully")
    ).toBeVisible({ timeout: 5000 });
    console.log("Completed PAYMENTS | TC - 7 : Re-initiate subscription");
  });
});
