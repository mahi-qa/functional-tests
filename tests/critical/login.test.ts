import { test, expect } from "@playwright/test";
import configs from "../test-configs";

test.describe("Login-Tests", () => {
  test("LOGIN | TC - 1 : Verify Login for Unregistered Mobile Number - Using Passcode", async ({
    page,
  }) => {
    console.log(
      "Starting LOGIN | TC - 1 : Verify Login for Unregistered Mobile Number - Using Passcode"
    );
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(configs.TEST_CONSTANTS.TEST_USER_UNREGISTERED_NUMBER);
    console.log(
      `Filled unregistered mobile number: ${configs.TEST_CONSTANTS.TEST_USER_UNREGISTERED_NUMBER}`
    );
    await page
      .getByRole("button", { name: "Login with Passcode" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login with Passcode' button");
    await page.isVisible(
      "text='The mobile number you entered is not registered.'"
    );
    console.log(
      "Validation for unregistered mobile number completed - Using Passcode"
    );
    console.log(
      "Completed LOGIN | TC - 1 : Verify Login for Unregistered Mobile Number - Using Passcode"
    );
  });

  test("LOGIN | TC - 2 : Verify Login for Unregistered Mobile Number - Using OTP", async ({
    page,
  }) => {
    console.log(
      "Starting LOGIN | TC - 2 : Verify Login for Unregistered Mobile Number - Using OTP"
    );
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(configs.TEST_CONSTANTS.TEST_USER_UNREGISTERED_NUMBER);
    console.log(
      `Filled unregistered mobile number: ${configs.TEST_CONSTANTS.TEST_USER_UNREGISTERED_NUMBER}`
    );
    await page
      .getByRole("button", { name: "Login Using OTP" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login Using OTP' button");
    await page.isVisible(
      "text='The mobile number you entered is not registered.'"
    );
    console.log(
      "Validation for unregistered mobile number completed - Using OTP"
    );
    console.log(
      "Completed LOGIN | TC - 2 : Verify Login for Unregistered Mobile Number - Using OTP"
    );
  });

  test("LOGIN | TC - 3 : Validation for Mobile Number Field", async ({
    page,
  }) => {
    console.log(
      "Starting LOGIN | TC - 3 : Verify Login for Unregistered Mobile Number - Using OTP"
    );
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(configs.TEST_CONSTANTS.TEST_USER_INVALID_NUMBER);
    console.log(
      `Filled invalid mobile number: ${configs.TEST_CONSTANTS.TEST_USER_INVALID_NUMBER}`
    );
    await page
      .getByRole("button", { name: "Login with Passcode" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login with Passcode' button");
    await page.isVisible("text='Please enter a valid Mobile'");
    console.log(
      "Validation for Mobile Number Field completed - Invalid number"
    );
    console.log(
      "Completed LOGIN | TC - 3 : Verify Login for Unregistered Mobile Number - Using OTP"
    );
  });

  test("LOGIN | TC - 4 : Verify Login for Registered Mobile Number - Using Passcode", async ({
    page,
  }) => {
    console.log(
      "Starting LOGIN | TC - 4 : Verify Login for Registered Mobile Number - Using Passcode"
    );
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(
        configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_NON_OTP_TEST
      );
    console.log(
      `Filled registered mobile number: ${configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_NON_OTP_TEST}`
    );
    await page
      .getByRole("button", { name: "Login with Passcode" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login with Passcode' button");
    await page.locator("#passcode").click({ timeout: 5000 });
    console.log("Clicked on Passcode field");
    await page
      .locator("#passcode")
      .pressSequentially(
        configs.TEST_CONSTANTS.TEST_USER_PASSCODE_FOR_NON_OTP_TEST
      );
    console.log(
      `Entered Passcode: ${configs.TEST_CONSTANTS.TEST_USER_PASSCODE_FOR_NON_OTP_TEST}`
    );
    await page.getByRole("button", { name: "Login" }).click({ timeout: 5000 });
    console.log("Clicked on 'Login' button");
    await expect(page).toHaveURL(
      `${configs.TEST_CONSTANTS.APP_BASE_URL}/accounts`
    );
    console.log("Login successful, redirected to accounts page");
    console.log(
      "Completed LOGIN | TC - 4 : Verify Login for Registered Mobile Number - Using Passcode"
    );
  });

  test("LOGIN | TC - 5 : Validation for Passcode Field", async ({ page }) => {
    console.log("Starting LOGIN | TC - 5 : Validation for Passcode Field");
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(
        configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_NON_OTP_TEST
      );
    console.log(
      `Filled registered mobile number: ${configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_NON_OTP_TEST}`
    );
    await page
      .getByRole("button", { name: "Login with Passcode" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login with Passcode' button");
    await page.locator("#passcode").click({ timeout: 5000 });
    console.log("Clicked on Passcode field");
    await page.locator("#passcode").pressSequentially("1111");
    console.log("Entered invalid Passcode: 1111");
    await page.getByRole("button", { name: "Login" }).click({ timeout: 5000 });
    console.log("Clicked on 'Login' button");
    await page.isVisible("text='Invalid passcode'");
    console.log("Validation for Passcode Field completed - Invalid Passcode");
    console.log("Completed LOGIN | TC - 5 : Validation for Passcode Field");
  });

  test("LOGIN | TC - 6 : Verify Resend OTP Button | Validation for OTP Field | Validation for OTP Field when the OTP is Entered and Deleted | Verify Login for Registered Mobile Number - Using OTP", async ({
    page,
    request,
  }) => {
    console.log(
      "Starting LOGIN | TC - 6 : Verify Resend OTP Button | Validation for OTP Field | Validation for OTP Field when the OTP is Entered and Deleted | Verify Login for Registered Mobile Number - Using OTP"
    );
    // Verify Resend OTP Button
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
    console.log(
      `Filled registered mobile number: ${configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST}`
    );
    await page
      .getByRole("button", { name: "Login Using OTP" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login Using OTP' button");
    await page.getByText("Resend OTP").click({ timeout: 5000 });
    console.log("Clicked on 'Resend OTP' button");
    await page.isVisible("text='Otp message sent successfully'");
    console.log("Resend OTP button validation completed");

    // Validation for OTP Field
    await page
      .getByLabel("Please enter OTP character 1")
      .click({ timeout: 5000 });
    console.log("Clicked on OTP character 1 field");
    await page.getByLabel("Please enter OTP character 1").fill("1");
    console.log("Entered '1' in OTP character 1 field");
    // ...
    console.log(configs.TEST_CONSTANTS.API_BASE_URL);
    console.log(configs.TEST_CONSTANTS.X_API_KEY);

    let getOtp = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}` +
        "/api/v2/functional-tests-helper/otp",
      {
        method: "POST",
        body: JSON.stringify({
          mobileNumber:
            configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
        },
      }
    );

    const otpDetails = await getOtp.json();
    console.log(otpDetails);
    if (otpDetails && otpDetails.data && otpDetails.data.otp) {
      const otpValue = otpDetails.data.otp.split("");
      await page.getByLabel("Please enter OTP character 1").fill(otpValue[0]);
      await page.getByLabel("Please enter OTP character 2").fill(otpValue[1]);
      await page.getByLabel("Please enter OTP character 3").fill(otpValue[2]);
      await page.getByLabel("Please enter OTP character 4").fill(otpValue[3]);
      await page
        .getByRole("button", { name: "Verify & Login" })
        .click({ timeout: 5000 });
      console.log("Clicked on 'Verify & Login' button");
      await expect(page.getByText("Login as Student")).toBeVisible();
      console.log("Login successful, redirected to accounts page");
    } else {
      test.fail();
    }
    console.log(
      "Completed LOGIN | TC - 6 : Verify Resend OTP Button | Validation for OTP Field | Validation for OTP Field when the OTP is Entered and Deleted | Verify Login for Registered Mobile Number - Using OTP"
    );
  });

  test("LOGIN | TC - 7 : Verify Forgot Passcode Functionality", async ({
    page,
  }) => {
    console.log(
      "Starting LOGIN | TC - 7 : Verify Forgot Passcode Functionality"
    );
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    console.log(`Navigated to ${configs.TEST_CONSTANTS.APP_BASE_URL}/login`);
    await page.getByPlaceholder("932xxxxxxx").click({ timeout: 5000 });
    console.log("Clicked on Mobile Number field");
    await page
      .getByPlaceholder("932xxxxxxx")
      .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
    console.log(
      `Filled registered mobile number: ${configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST}`
    );
    await page.waitForTimeout(1000);
    await page
      .getByRole("button", { name: "Login with Passcode" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Login with Passcode' button");
    await page.waitForTimeout(1000);
    await page
      .getByRole("heading", { name: "Forgot Passcode?" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Forgot Passcode?' link");
    await page.waitForTimeout(1000);
    await page
      .getByRole("button", { name: "Proceed" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Proceed' button");
    await page.waitForTimeout(1000);

    async function fetchOtpWithRetry(maxRetries = 5, delayMs = 1000) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await fetch(
          `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/otp`,
          {
            method: "POST",
            body: JSON.stringify({
              mobileNumber:
                configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST,
            }),
            headers: {
              "Content-Type": "application/json",
              "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
            },
          }
        );

        const data = await res.json();
        if (data?.data?.otp) return data.data.otp;

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      return null;
    }

    const otp = await fetchOtpWithRetry();
    if (!otp) return test.fail();

    const otpChars = otp.split("");
    for (let i = 0; i < otpChars.length; i++) {
      await page
        .getByLabel(`Please enter OTP character ${i + 1}`)
        .fill(otpChars[i]);
    }

    await page.getByRole("button", { name: "Next" }).click({ timeout: 5000 });
    console.log("Clicked on 'Next' button");
    await page.getByPlaceholder("Set a 4 digit passcode").fill("1234");
    console.log("Filled new passcode: 1234");
    await page.getByPlaceholder("Re-enter the 4 digit passcode").fill("1234");
    console.log("Re-entered new passcode: 1234");
    await page
      .getByRole("button", { name: "Set New Passcode & Login" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Set New Passcode & Login' button");

    await expect(page.getByText("Login as Student")).toBeVisible();
    console.log("Login successful, redirected to accounts page");
    console.log(
      "Completed LOGIN | TC - 7 : Verify Forgot Passcode Functionality"
    );
  });
});
