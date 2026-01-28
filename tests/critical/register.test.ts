import { test, expect } from "@playwright/test";
import configs from "../test-configs";
import { cleanUpDemoLeadCreation } from "../helper/setup";

async function getOtp() {
  let otpDetails = await fetch(
    `${configs.TEST_CONSTANTS.API_BASE_URL}` +
      "/api/v2/functional-tests-helper/otp",
    {
      method: "POST",
      body: JSON.stringify({
        mobileNumber: configs.TEST_CONSTANTS.TEST_USER_DEMO_BOOKING_NUMBER,
      }),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
      },
    }
  );

  return otpDetails;
}

test.describe("Register-Tests", async () => {
  test.beforeAll(async () => {
    await cleanUpDemoLeadCreation(
      configs.TEST_CONSTANTS.TEST_USER_DEMO_BOOKING_NUMBER
    );
  });

  test("REGISTER | TC - 1 : Verify Register for Registered Number", async ({
    page,
  }) => {
    console.log(
      "Starting REGISTER | TC - 1 Verify Register for Registered Number"
    );
    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/register`);
    console.log("Navigated to Register page");
    await page
      .locator("#mobileNumber")
      .first()
      .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
    console.log("Mobile number field is filled");
    await page
      .getByRole("button", { name: "Proceed with OTP" })
      .click({ timeout: 5000 });
    console.log("Proceed with OTP button clicked");
    await page.isVisible(
      "text='The mobile number you entered already exists with another account'"
    );
    console.log(
      "The mobile number you entered already exists with another account message is visible"
    );
    console.log(
      "Completed REGISTER | TC - 1 Verify Register for Registered Number"
    );
  });

  test("REGISTER | TC - 2 : Verify resend OTP | Demo booking", async ({
    page,
  }) => {
    test.setTimeout(240000);

    console.log("Starting TC for Register, Demo Booking and Resend OTP button");

    await page.goto(`${configs.TEST_CONSTANTS.APP_BASE_URL}/register`);
    console.log("Navigated to Register page");
    await page
      .locator("#mobileNumber")
      .first()
      .fill(configs.TEST_CONSTANTS.TEST_USER_DEMO_BOOKING_NUMBER);
    console.log("Mobile number field is filled");

    await expect(
      page.getByRole("button", { name: "Proceed With OTP" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Proceed with otp button is visible");
    await page
      .getByRole("button", { name: "Proceed With OTP" })
      .click({ timeout: 5000 });
    console.log("Proceed with otp button clicked");
    await expect(
      page.getByRole("heading", { name: "We’ve sent a verification" })
    ).toBeVisible({ timeout: 5000 });
    console.log("We've sent an OTP heading visible");

    await page.waitForTimeout(33000);

    await expect(page.getByText("Resend OTP")).toBeVisible({ timeout: 5000 });
    console.log("Resend OTP button visible");
    await page.getByText("Resend OTP").click({ timeout: 5000 });
    console.log("Resend OTP button clicked");
    await expect(page.getByText("OTP sent successfully")).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "OTP sent successfully heading is visible after clicking on Resend OTP button"
    );

    let otpData = await getOtp();
    let otpDetails = await otpData?.json();

    let otpValue = "";

    console.log(otpDetails);

    if (otpDetails && otpDetails?.data && otpDetails?.data?.otp) {
      otpValue = otpDetails.data.otp.split("");
    }

    await page.waitForTimeout(3000);

    await expect(page.getByLabel("Please enter OTP character 1")).toBeVisible({
      timeout: 2000,
    });
    console.log("Filling OTP characters");
    await page.getByLabel("Please enter OTP character 1").fill(otpValue[0]);
    console.log("Filled first OTP character");

    await expect(page.getByLabel("Please enter OTP character 2")).toBeVisible({
      timeout: 2000,
    });
    console.log("Filling second OTP character");

    await page.getByLabel("Please enter OTP character 2").fill(otpValue[1]);
    console.log("Filled second OTP character");

    await expect(page.getByLabel("Please enter OTP character 3")).toBeVisible({
      timeout: 2000,
    });
    console.log("Filling third OTP character");

    await page.getByLabel("Please enter OTP character 3").fill(otpValue[2]);
    console.log("Filled third OTP character");

    await expect(page.getByLabel("Please enter OTP character 4")).toBeVisible({
      timeout: 2000,
    });
    console.log("Filling fourth OTP character");

    await page.getByLabel("Please enter OTP character 4").fill(otpValue[3]);
    console.log("Filled fourth OTP character");

    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
      timeout: 3000,
    });
    console.log("Continue button is visible");

    await page
      .getByRole("button", { name: "Continue" })
      .click({ timeout: 5000 });
    console.log("Continue button clicked");

    await page.waitForTimeout(3000);

    await expect(page.getByPlaceholder("FIRST NAME")).toBeVisible({
      timeout: 3000,
    });
    console.log("Filling student details");
    await page.getByPlaceholder("FIRST NAME").click({ timeout: 5000 });
    console.log("Clicked on first name field");
    await page.getByPlaceholder("FIRST NAME").fill("Demo");
    console.log("Filled the first name of the student");

    await expect(page.getByPlaceholder("LAST NAME")).toBeVisible({
      timeout: 3000,
    });
    console.log("Filling last name of the student");
    await page.getByPlaceholder("LAST NAME").click({ timeout: 5000 });
    console.log("Clicked on last name field");
    await page.getByPlaceholder("LAST NAME").fill("Lead");
    console.log("Filled the last name of the student");

    await expect(page.getByLabel("CBSE")).toBeVisible({ timeout: 5000 });
    console.log("Selecting board name as CBSE");
    await page.getByLabel("CBSE").click({ timeout: 5000 });
    console.log("Selected board name as CBSE");

    await expect(page.getByLabel("6")).toBeVisible({ timeout: 5000 });
    console.log("Selecting 6th grade");
    await page.getByLabel("6").click({ timeout: 5000 });
    console.log("Selected 6th grade");

    await expect(page.getByPlaceholder("Select city")).toBeVisible({
      timeout: 5000,
    });
    console.log("Selecting city");
    await page.getByPlaceholder("Select city").click({ timeout: 5000 });
    console.log("City selection dropdown opened");
    await page.getByPlaceholder("Select city").fill("Bengaluru");
    console.log("Filled city name as Bengaluru");
    await expect(page.getByText("Bengaluru (Bangalore Urban),")).toBeVisible({
      timeout: 5000,
    });
    console.log("Bengaluru (Bangalore Urban) city is visible in dropdown");
    await page
      .getByText("Bengaluru (Bangalore Urban),")
      .click({ timeout: 5000 });
    console.log("Selected the city");

    await expect(
      page.getByLabel("National Public School (NPS) - JP Nagar")
    ).toBeVisible({ timeout: 5000 });
    console.log("Selecting school as NPS - JP Nagar");
    await page.getByLabel("National Public School (NPS) - JP Nagar").check();
    console.log("Selected the school as NPS - JP Nagar");

    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
      timeout: 5000,
    });
    console.log("Continue button is visible");
    await page
      .getByRole("button", { name: "Continue" })
      .click({ timeout: 5000 });
    console.log("Clicked on the continue button");

    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#slot-0")).toBeVisible({ timeout: 5000 });
    console.log("Date field is visible");

    await page.locator("#slot-0").click({ timeout: 5000 });
    console.log("First availabe date selected by user");
    await page.waitForTimeout(2000);

    await expect(page.locator("#timeSlot-0")).toBeVisible({ timeout: 5000 });
    console.log("Time slot is visible");
    await page.locator("#timeSlot-0").check();
    console.log("First time slot selected by user");

    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "Continue button is visible after selecting date and time slot"
    );
    await page
      .getByRole("button", { name: "Continue" })
      .click({ timeout: 5000 });
    console.log("Continue button clicked by the user");

    try {
      await expect(page.locator('img[alt="check-verified"]')).toBeVisible({
        timeout: 5000,
      });
      console.log("Tick mark is visible");
    } catch (err) {
      console.log("Date or time slot is not available :", err?.message);
      test.fail();
    }

    await expect(
      page.getByRole("heading", { name: "Demo's demo class is booked!" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Demo class booked text is visible");

    await expect(
      page.getByRole("button", { name: "View Dashboard" })
    ).toBeVisible({ timeout: 5000 });
    console.log("View Dashboard button is visible");
    await page
      .getByRole("button", { name: "View Dashboard" })
      .click({ timeout: 5000 });
    console.log("Clicked on the View Dashboard button");

    console.log("Filling parent details");
    await expect(page.getByPlaceholder("First Name")).toBeVisible({
      timeout: 5000,
    });
    console.log("First name field is visible for parent details");
    await page.getByPlaceholder("First Name").click({ timeout: 5000 });
    console.log("Clicked on first name field of parent");
    await page.getByPlaceholder("First Name").fill("Demo");
    console.log("Filled first name of parent");

    await expect(page.getByPlaceholder("Last Name")).toBeVisible({
      timeout: 5000,
    });
    console.log("Last name field is visible for parent details");
    await page.getByPlaceholder("Last Name").click({ timeout: 5000 });
    console.log("Clicked on last name field of parent");
    await page.getByPlaceholder("Last Name").fill("Parent");
    console.log("Filled last name of parent");

    await expect(
      page.getByPlaceholder("Relationship with Student")
    ).toBeVisible({ timeout: 5000 });
    console.log("Relationship with student field is visible");
    await page
      .getByPlaceholder("Relationship with Student")
      .click({ timeout: 5000 });
    console.log("Clicked on relationship with student field");
    await expect(page.getByText("Father")).toBeVisible({ timeout: 5000 });
    console.log("Father relationship option is visible");
    await page.getByText("Father").click({ timeout: 5000 });
    console.log("Relationship with student selected as father");

    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible({
      timeout: 5000,
    });
    console.log("Submit button is visible for parent details");
    await page.getByRole("button", { name: "Submit" }).click({ timeout: 5000 });
    console.log("Submit button clicked");

    await expect(
      page.getByRole("heading", { name: "Upcoming Demo Class" })
    ).toBeVisible({ timeout: 5000 });
    console.log("Upcoming demo class heading is visible");

    await expect(page.getByText("Class starts in:")).toBeVisible({
      timeout: 5000,
    });
    console.log("Class starts in heading is visible");

    await cleanUpDemoLeadCreation(
      configs.TEST_CONSTANTS.TEST_USER_DEMO_BOOKING_NUMBER
    );
    console.log(
      "Completed REGISTER | TC - 2 : Verify resend OTP | Demo booking"
    );
  });
});
