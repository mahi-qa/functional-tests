import { Page, expect, request } from "@playwright/test";
import configs from "../test-configs";
import testConfigs from "../test-configs";

export async function retryOperation(
  operation: () => Promise<void>,
  retries: number,
  delay: number
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Operation failed after ${retries} attempts: ${error}`);
      }
      console.log(`Attempt ${attempt} failed. Retrying after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function cleanUpClassProgress() {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("x-api-key", configs.TEST_CONSTANTS.X_API_KEY);

  try {
    console.log("Calling class progress cleanup api");

    const postResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/class-progress/clean-up`,
      {
        method: "POST",
        body: JSON.stringify({
          mobileNumber:
            configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_NON_OTP_TEST,
        }),
        headers: requestHeaders,
      }
    );

    console.log("Response Status:", postResponse.status);

    const responseBody = await postResponse.json();
    console.log("Response Body:", responseBody);

    if (postResponse.ok) {
      console.log("Class progress cleanup done");
    } else {
      console.log("Class progress cleanup failed:", responseBody?.message);
    }
  } catch (err) {
    console.error("Error during class progress cleanup:", err);
  }
}

export async function cleanUpBatchCreation() {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("x-api-key", configs.TEST_CONSTANTS.X_API_KEY);

  console.log("Calling API for Batch cleanup");

  try {
    const deleteResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/admin-functional-tests/cleanup?mobileNumber=${configs.TEST_CONSTANTS.TEST_STUDENT_FOR_ADMIN_TEST_CASES_NUMBER}`,
      {
        method: "DELETE",
        headers: requestHeaders,
      }
    );

    if (deleteResponse.status === 200)
      console.log("Batch creation cleanup done");
  } catch (err) {
    console.log(err?.message);
  }
}

export async function cleanupPracticeSheetCreation() {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("x-api-key", configs.TEST_CONSTANTS.X_API_KEY);

  console.log("Calling practice sheet cleanup api");

  try {
    const deleteResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/practice-sheet-management/cleanup?mobileNumber=${testConfigs.TEST_CONSTANTS.TEST_STUDENT_FOR_INCLASS_NUMBER}`,
      {
        method: "DELETE",
        headers: requestHeaders,
      }
    );

    console.log("Response: ", deleteResponse);

    if (deleteResponse.status === 200)
      console.log("Practice sheet cleanup done");
  } catch (err) {
    console.log("error", err?.message);
  }
}

export async function cleanUpDemoLeadCreation(mobileNumber: string) {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("x-api-key", configs.TEST_CONSTANTS.X_API_KEY);

  console.log("Calling demo lead cleanup api");

  try {
    const deleteResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/demo-lead/cleanup?mobileNumber=${mobileNumber}`,
      {
        method: "DELETE",
        headers: requestHeaders,
      }
    );

    console.log("Response: ", deleteResponse);

    if (deleteResponse.status === 200) console.log("Demo lead cleanup done");
  } catch (err) {
    console.log("error", err?.message);
  }
}

export async function cleanupTestPayment() {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("x-api-key", configs.TEST_CONSTANTS.X_API_KEY);

  console.log("Calling payments cleanup api");

  try {
    const deleteResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/payments-module/cleanup`,
      {
        method: "DELETE",
        body: JSON.stringify({
          mobileNumber: configs.TEST_CONSTANTS.TEST_USER_PAYMENTS_NUMBER,
        }),
        headers: requestHeaders,
      }
    );

    if (deleteResponse.status === 200) console.log("Test payment cleanup done");
  } catch (err) {
    console.log(err?.message);
  }
}

export async function loginAsAdmin(page: Page) {
  await cleanUpBatchCreation();

  await retryOperation(
    async () => {
      await page.goto(configs.TEST_CONSTANTS.APP_ADMIN_URL, { timeout: 60000 });
      console.log("Navigated to admin URL");
      await page
        .getByRole("button", { name: "Google logo Sign in as Admin" })
        .click({ timeout: 5000 });
      console.log("Clicked on Google logo Sign in as Admin button");
      await page.waitForTimeout(2000);

      console.log("Logged in As Admin");
    },
    3,
    5000
  );
}

export async function loginAsAdminLighthouse(page: Page) {
  await retryOperation(
    async () => {
      await page.goto(configs.TEST_CONSTANTS.APP_LIGHTHOUSE_URL, {
        timeout: 60000,
      });
      console.log("Navigated to lighthouse admin URL");
      await page
        .getByRole("button", { name: "Login as a Admin" })
        .click({ timeout: 5000 });
      console.log("Clicked on Login as a Admin button");

      await page.waitForTimeout(2000);

      console.log("Logged in As Admin on lighthouse");
    },
    3,
    5000
  );
}

export async function loginAsTutor(page: Page) {
  await retryOperation(
    async () => {
      await page.goto(configs.TEST_CONSTANTS.APP_ADMIN_URL, { timeout: 60000 });
      console.log("Navigated to admin URL");
      await page
        .getByRole("button", { name: "Google logo Sign in as Admin" })
        .click({ timeout: 5000 });
      console.log("Clicked on Google logo Sign in as Admin button");
      await page.waitForTimeout(2000);
      console.log("Logged in As Tutor");
    },
    3,
    5000
  );
}

export async function loginAsStudent(page: Page) {
  await retryOperation(
    async () => {
      await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`, {
        timeout: 120000,
      });
      console.log("Navigated to login page");

      // Fill mobile number and initiate login
      await page
        .getByPlaceholder("932xxxxxxx")
        .fill(configs.TEST_CONSTANTS.TEST_STUDENT_FOR_INCLASS_NUMBER);
      console.log("Filled mobile number");
      await page
        .getByRole("button", { name: "Login with Passcode" })
        .click({ timeout: 5000 });
      console.log("Clicked on Login with Passcode button");

      // Inner retry for entering the passcode
      await retryOperation(
        async () => {
          await page.locator("#passcode").click({ timeout: 5000 });
          console.log("Clicked on passcode input field");
          await page
            .locator("#passcode")
            .pressSequentially(
              configs.TEST_CONSTANTS.TEST_STUDENT_FOR_INCLASS_PASSCODE
            );
          console.log("Entered passcode");
          await page
            .getByRole("button", { name: "Login" })
            .click({ timeout: 20000 });
          console.log("Clicked on Login button");
        },
        2,
        3000
      );

      await expect(page).toHaveURL(
        `${configs.TEST_CONSTANTS.APP_BASE_URL}/accounts`
      );
      console.log("Successfully logged in, now selecting user");
      await page
        .getByText(/QUQATest User/i)
        .first()
        .click({ timeout: 20000 });
      console.log("Selected user QUQATest User");
      await page
        .getByRole("button", { name: "Proceed" })
        .click({ timeout: 20000 });
      console.log("Clicked on Proceed button");
      await page.waitForTimeout(5000);
      await page.waitForLoadState("domcontentloaded");

      // Validate successful login by checking home page URL
      await expect(page).toHaveURL(
        `${configs.TEST_CONSTANTS.APP_BASE_URL}/s/home`
      );
      console.log("Successfully logged in as student");
    },
    3,
    5000
  );
}

export async function loginAsInterventionStudent(page: Page) {
  await retryOperation(
    async () => {
      await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`, {
        timeout: 120000,
      });
      console.log("Navigated to login page");

      // Fill mobile number and initiate login
      await page
        .getByPlaceholder("932xxxxxxx")
        .fill(configs.TEST_CONSTANTS.TEST_STUDENT_INTERVENTION_NUMBER);
      console.log("Filled mobile number");
      await page
        .getByRole("button", { name: "Login with Passcode" })
        .click({ timeout: 5000 });
      console.log("Clicked on Login with Passcode button");

      // Inner retry for entering the passcode
      await retryOperation(
        async () => {
          await page.locator("#passcode").click({ timeout: 5000 });
          console.log("Clicked on passcode input field");
          await page
            .locator("#passcode")
            .pressSequentially(
              configs.TEST_CONSTANTS.TEST_STUDENT_INTERVENTION_PASSCODE
            );
          console.log("Entered passcode");
          await page
            .getByRole("button", { name: "Login" })
            .click({ timeout: 20000 });
          console.log("Clicked on Login button");
        },
        2,
        3000
      );

      await expect(page).toHaveURL(
        `${configs.TEST_CONSTANTS.APP_BASE_URL}/accounts`
      );
      console.log("Successfully logged in, now selecting user");
      await page
        .getByText(/QIQA Intervention/i)
        .first()
        .click({ timeout: 20000 });
      console.log("Selected user QIQA Intervention");
      await page
        .getByRole("button", { name: "Proceed" })
        .click({ timeout: 20000 });
      console.log("Clicked on Proceed button");
      await page.waitForTimeout(5000);
      await page.waitForLoadState("domcontentloaded");

      // Validate successful login by checking home page URL
      await expect(page).toHaveURL(
        `${configs.TEST_CONSTANTS.APP_BASE_URL}/s/home`
      );
      console.log("Successfully logged in as student");
    },
    3,
    5000
  );
}

export async function loginAsParent(page: Page) {
  await retryOperation(
    async () => {
      await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`, {
        timeout: 120000,
      });
      console.log("Navigated to login page");

      // Fill mobile number and initiate login
      await page
        .getByPlaceholder("932xxxxxxx")
        .fill(configs.TEST_CONSTANTS.TEST_STUDENT_FOR_INCLASS_NUMBER);
      console.log("Filled mobile number");
      await page
        .getByRole("button", { name: "Login with Passcode" })
        .click({ timeout: 5000 });
      console.log("Clicked on Login with Passcode button");

      // Inner retry for entering the passcode
      await retryOperation(
        async () => {
          await page.locator("#passcode").click({ timeout: 5000 });
          console.log("Clicked on passcode input field");
          await page
            .locator("#passcode")
            .pressSequentially(
              configs.TEST_CONSTANTS.TEST_STUDENT_FOR_INCLASS_PASSCODE
            );
          console.log("Entered passcode");
          await page
            .getByRole("button", { name: "Login" })
            .click({ timeout: 20000 });
          console.log("Clicked on Login button");
        },
        2,
        3000
      );

      await expect(page).toHaveURL(
        `${configs.TEST_CONSTANTS.APP_BASE_URL}/accounts`
      );
      console.log("Successfully logged in, now selecting user");
      await page.getByText("QPQA ParentParent").click({ timeout: 10000 });
      console.log("Selected user QPQA ParentParent");
      await page.getByText("QUClass VIQATest User").click({ timeout: 10000 });
      console.log("Selected user QUClass VIQATest User");

      await page
        .getByRole("button", { name: "Proceed" })
        .click({ timeout: 20000 });
      console.log("Clicked on Proceed button");
      await page.waitForTimeout(5000);
      await page.waitForLoadState("domcontentloaded");
    },
    3,
    5000
  );
}

export async function getApiContext() {
  let apiContext = await request.newContext({
    baseURL: testConfigs.TEST_CONSTANTS.API_BASE_URL,
    extraHTTPHeaders: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "x-api-key": testConfigs.TEST_CONSTANTS.X_API_KEY,
    },
  });

  return apiContext;
}

export const acceptCookiesIfVisible = async (page: Page) => {
  const cookiesButton = page.getByRole("button", { name: "Accept All" });
  const cookiesButtonVisible = await cookiesButton.isVisible();

  if (cookiesButtonVisible) {
    console.log("Cookies button is visible");
    await cookiesButton.click({ timeout: 5000 });
    console.log("Cookies button clicked");
  }
};

export async function cleanUpActivitiesBooking(mobileNumber: string) {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("x-api-key", configs.TEST_CONSTANTS.X_API_KEY);

  console.log(
    `Calling activity cleanup (demo booking) API for ${mobileNumber}`
  );

  try {
    const deleteResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/mobile-app/demo-booking-cleanup?mobileNumber=${mobileNumber}`,
      {
        method: "DELETE",
        headers: requestHeaders,
      }
    );

    const resText = await deleteResponse.text();
    console.log("DELETE Response: ", resText);

    if (deleteResponse.status === 200) {
      console.log("Activity cleanup done");
    } else {
      console.warn("Activity cleanup failed");
    }
  } catch (err) {
    console.log("Activity cleanup error:", err?.message);
  }
}
