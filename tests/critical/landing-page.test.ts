import path from "path";
import { test, expect } from "@playwright/test";
import configs from "../test-configs";
import { verifyActivityLog } from "../helper/activityHelper";
import { fetchStudentIdByMobileAndEmail } from "../helper/studentHelper";
import { fetchSchoolIdByName } from "../helper/schoolHelper";

const fetchOtp = async () => {
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
  return res.json();
};
import {
  cleanUpActivitiesBooking,
  cleanUpDemoLeadCreation,
} from "../helper/setup";

test.describe("Landing-Page-Tests", async () => {
  test("LANDING PAGE | TC - 1 : Page Load and Title Verification", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );
    console.log(
      "Starting LANDING PAGE | TC - 1 : Page Load and Title Verification"
    );
    await page.goto(configs.TEST_CONSTANTS.UPRIO_URL);
    await expect(
      page.getByLabel("AI-powered online tuitions,").locator("canvas")
    ).toBeVisible({ timeout: 5000 });
    console.log("Canvas element is visible");
    await page.getByLabel("Go to homepage").click({ timeout: 5000 });
    console.log("Clicked on 'Go to homepage'");
    console.log(
      "Completed LANDING PAGE | TC - 1 : Page Load and Title Verification"
    );
  });

  test.describe("Activity Tests", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      `Test only for Chromium!`
    );
    test.afterEach(async () => {
      await cleanUpActivitiesBooking(
        configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST
      );
    });
    test("LANDING PAGE | TC - 2 : Get Started Form Validation For Registered Number", async ({
      page,
    }) => {
      console.log(
        "Starting LANDING PAGE | TC - 2 : Get Started Form Validation"
      );
      await page.goto(`${configs.TEST_CONSTANTS.UPRIO_URL}/#trial`);
      console.log("Navigated to Uprio trial page");
      await expect(
        page.getByRole("textbox", { name: "Full name* Full name* Full" })
      ).toBeVisible({ timeout: 10000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .click({ timeout: 10000 });
      console.log("Clicked on full name textbox");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .fill("QA Lead");
      console.log("Filled full name with 'QA Lead'");
      await expect(
        page.getByRole("textbox", { name: "Mobile number* Mobile number*" })
      ).toBeVisible({ timeout: 10000 });
      console.log("Mobile number textbox is visible");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .click({ timeout: 10000 });
      console.log("Clicked on mobile number textbox");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
      console.log("Filled mobile number");
      await expect(
        page.getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({ timeout: 10000 });
      console.log("Verify OTP button is visible");
      await page
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 10000 });
      console.log("Clicked on 'Verify OTP' button");
      await expect(page.getByLabel("Enter OTP*")).toBeVisible({
        timeout: 10000,
      });
      console.log("Enter OTP field is visible");
      await page.getByLabel("Enter OTP*").click({ timeout: 10000 });
      console.log("Clicked on OTP field");
      const otpDetails = await fetchOtp();
      await page.getByLabel("Enter OTP*").fill(otpDetails.data.otp);
      console.log("Filled OTP");
      await expect(page.getByRole("combobox")).toBeVisible({ timeout: 10000 });
      console.log("City combobox is visible");
      await page.getByRole("combobox").click({ timeout: 10000 });
      console.log("Clicked on city combobox");
      await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible(
        { timeout: 10000 }
      );
      console.log("City search box is visible");
      await page
        .getByRole("searchbox", { name: "Search" })
        .click({ timeout: 10000 });
      console.log("Clicked on city search box");
      await page.getByRole("searchbox", { name: "Search" }).fill("bangalore");
      console.log("Filled city search with 'bangalore'");
      await expect(
        page.getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
      ).toBeVisible({ timeout: 10000 });
      console.log("Bangalore option is visible");
      await page
        .getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
        .click({ timeout: 10000 });
      console.log("Clicked on Bangalore option");
      await expect(
        page.getByRole("textbox", { name: "School name" })
      ).toBeVisible({ timeout: 10000 });
      console.log("School name textbox is visible");
      await page
        .getByRole("textbox", { name: "School name" })
        .click({ timeout: 10000 });
      console.log("Clicked on school name textbox");
      await page.waitForSelector(
        '[role="option"]:has-text("National Public School - Agara")',
        {
          timeout: 10000,
        }
      );
      console.log("Target option is now present in DOM after filtering");
      await page
        .getByRole("option", { name: "National Public School - Agara" })
        .scrollIntoViewIfNeeded();
      console.log("Scrolled to NPS Agara option");
      await expect(
        page.getByRole("option", { name: "National Public School - Agara" })
      ).toBeVisible({ timeout: 10000 });
      console.log("NPS Agara option is visible");
      await page
        .getByRole("option", { name: "National Public School - Agara" })
        .click({ timeout: 10000 });
      console.log("Clicked on NPS Agara option");
      await expect(page.locator("#trial").getByText("Grade 6")).toBeVisible({
        timeout: 10000,
      });
      console.log("Grade 6 option is visible");
      await page
        .locator("#trial")
        .getByText("Grade 6")
        .click({ timeout: 10000 });
      console.log("Clicked on Grade 6");
      await expect(
        page.getByRole("button", { name: "GET STARTED" })
      ).toBeEnabled({ timeout: 10000 });
      console.log("GET STARTED button is now enabled");
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/v2/enrollment") && resp.status() === 200
        ),
        page
          .getByRole("button", { name: "GET STARTED" })
          .click({ timeout: 20000 }),
      ]);
      console.log("Clicked on 'GET STARTED' button");
      expect(response.ok()).toBeTruthy();
      // Wait for the success message before proceeding
      await expect(
        page.locator("#trial").getByText("Form submitted successfully!")
      ).toBeVisible({ timeout: 20000 });
      console.log("Success message is visible");

      // Retry logic for studentId and activity log
      async function waitForStudentId(maxRetries = 5, delay = 2000) {
        for (let i = 0; i < maxRetries; i++) {
          const studentId = await fetchStudentIdByMobileAndEmail({
            mobileNumber:
              configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST,
            email:
              configs.TEST_CONSTANTS.TEST_USER_REGISTERED_EMAIL_FOR_OTP_TEST,
            apiKey: configs.TEST_CONSTANTS.X_API_KEY,
            baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
          });
          if (studentId) return studentId;
          await page.waitForTimeout(delay);
        }
        throw new Error("Student ID not found after retries");
      }
      async function waitForActivity(studentId, maxRetries = 5, delay = 2000) {
        for (let i = 0; i < maxRetries; i++) {
          const activity = await verifyActivityLog({
            studentId: studentId!,
            name: "QA Lead",
            grade: "6",
            apiKey: configs.TEST_CONSTANTS.X_API_KEY,
            baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
          });
          if (activity) return activity;
          await page.waitForTimeout(delay);
        }
        throw new Error("Activity log not found after retries");
      }
      const studentId = await waitForStudentId();
      expect(studentId).toBeTruthy();
      const activity = await waitForActivity(studentId);
      expect(activity).toBeTruthy();
      console.log("Activity log verification successful");
      console.log(
        "Completed LANDING PAGE | TC - 2 : Get Started Form Validation For Registered Number"
      );
    });

    test("LANDING PAGE | TC - 3 : Get Started Form Invalid Field Validations", async ({
      page,
    }) => {
      console.log(
        "Starting LANDING PAGE | TC - 3 : Get Started Form Invalid Field Validations"
      );
      await page.goto(`${configs.TEST_CONSTANTS.UPRIO_URL}/#trial`);
      console.log("Navigated to Uprio trial page");
      await expect(
        page.getByRole("textbox", { name: "Full name* Full name* Full" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .click({ timeout: 5000 });
      console.log("Clicked on full name textbox");
      await expect(
        page
          .locator("#trial div")
          .filter({ hasText: "1-week free trial! After" })
          .first()
      ).toBeVisible({ timeout: 5000 });
      console.log("Trial section is visible");
      await page
        .locator("#trial div")
        .filter({ hasText: "1-week free trial! After" })
        .first()
        .click({ timeout: 5000 });
      console.log("Clicked on trial section");
      await expect(
        page.locator("#trial").getByText("Enter your full name.")
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name validation message is visible");
      await expect(
        page.getByRole("textbox", { name: "Full name* Full name* Full" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .click({ timeout: 5000 });
      console.log("Clicked on full name textbox");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .fill("QA");
      console.log("Filled full name with 'QA'");
      await expect(
        page
          .locator("#trial div")
          .filter({ hasText: "1-week free trial! After" })
          .first()
      ).toBeVisible({ timeout: 5000 });
      console.log("Trial section is visible");
      await page
        .locator("#trial div")
        .filter({ hasText: "1-week free trial! After" })
        .first()
        .click({ timeout: 5000 });
      console.log("Clicked on trial section");
      await expect(
        page.locator("#trial").getByText("Enter your full name.")
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name validation message is visible");
      await expect(
        page.getByRole("textbox", { name: "Full name* Full name* Full" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .click({ timeout: 5000 });
      console.log("Clicked on full name textbox");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .fill("QA Lead");
      console.log("Filled full name with 'QA Lead'");
      await expect(
        page.getByRole("textbox", { name: "Mobile number* Mobile number*" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Mobile number textbox is visible");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .click({ timeout: 5000 });
      console.log("Clicked on mobile number textbox");
      await expect(
        page
          .locator("#trial div")
          .filter({ hasText: "1-week free trial! After" })
          .first()
      ).toBeVisible({ timeout: 5000 });
      console.log("Trial section is visible");
      await page
        .locator("#trial div")
        .filter({ hasText: "1-week free trial! After" })
        .first()
        .click({ timeout: 5000 });
      console.log("Clicked on trial section");
      await expect(
        page.locator("#trial").getByText("Enter your mobile number.")
      ).toBeVisible({ timeout: 5000 });
      console.log("Mobile number validation message is visible");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .click({ timeout: 5000 });
      console.log("Clicked on mobile number textbox");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .fill("12345");
      console.log("Filled mobile number with '12345'");
      await expect(
        page
          .locator("#trial div")
          .filter({ hasText: "1-week free trial! After" })
          .first()
      ).toBeVisible({ timeout: 5000 });
      console.log("Trial section is visible");
      await page
        .locator("#trial div")
        .filter({ hasText: "1-week free trial! After" })
        .first()
        .click({ timeout: 5000 });
      console.log("Clicked on trial section");
      await expect(page.getByText("Number must be 10 digits")).toBeVisible({
        timeout: 5000,
      });
      console.log("10 digits validation message is visible");
      await expect(
        page.getByRole("textbox", { name: "Mobile number* Mobile number*" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Mobile number textbox is visible");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .click({ timeout: 5000 });
      console.log("Clicked on mobile number textbox");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
      console.log("Filled mobile number with valid number");
      await expect(
        page.getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({
        timeout: 5000,
      });
      console.log("Verify OTP button is visible");
      await page
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 5000 });
      console.log("Clicked on 'Verify OTP' button");
      await expect(page.getByLabel("Enter OTP*")).toBeVisible({
        timeout: 5000,
      });
      console.log("Enter OTP field is visible");
      await page.getByLabel("Enter OTP*").click({ timeout: 5000 });
      console.log("Clicked on OTP field");
      await expect(
        page
          .locator("#trial div")
          .filter({ hasText: "1-week free trial! After" })
          .first()
      ).toBeVisible({ timeout: 5000 });
      console.log("Trial section is visible");
      await page
        .locator("#trial div")
        .filter({ hasText: "1-week free trial! After" })
        .first()
        .click({ timeout: 5000 });
      console.log("Clicked on trial section");
      await expect(page.getByText("OTP must be 4 digits.")).toBeVisible({
        timeout: 5000,
      });
      console.log("OTP validation message is visible");
      await page.getByLabel("Enter OTP*").fill("1234");
      console.log("Filled OTP with '1234'");
      await expect(page.getByRole("combobox")).toBeVisible({ timeout: 5000 });
      console.log("City combobox is visible");
      await page.getByRole("combobox").click({ timeout: 5000 });
      console.log("Clicked on city combobox");
      await page
        .getByRole("searchbox", { name: "Search" })
        .fill("InvalidCityName");
      console.log("Filled city search with 'InvalidCityName'");
      await expect(
        page.getByRole("listbox").getByText("No results found")
      ).toBeVisible({ timeout: 5000 });
      console.log("No results found message is visible");
      await page.getByRole("searchbox", { name: "Search" }).fill("Delhi");
      console.log("Filled city search with 'Delhi'");
      await expect(
        page.getByRole("option", { name: "Delhi", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Delhi option is visible");
      await page
        .getByRole("option", { name: "Delhi", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on Delhi option");
      await expect(
        page.getByRole("textbox", { name: "School name" })
      ).toBeVisible({ timeout: 5000 });
      console.log("School name textbox is visible");
      await page
        .getByRole("textbox", { name: "School name" })
        .click({ timeout: 5000 });
      console.log("Clicked on school name textbox");
      await page
        .getByRole("textbox", { name: "School name" })
        .fill("National Public School");
      console.log("Filled school name with 'National Public School'");
      await page.waitForTimeout(2000); // Wait for the text to populate
      await expect(
        page.locator("#trial").getByText("UPRIO will be aligned with")
      ).toBeVisible({ timeout: 5000 });
      console.log("Alignment message is visible");
      await expect(page.locator("#trial").getByText("Grade 6")).toBeVisible({
        timeout: 5000,
      });
      console.log("Grade 6 option is visible");
      await page
        .locator("#trial")
        .getByText("Grade 6")
        .click({ timeout: 5000 });
      console.log("Clicked on Grade 6");
      await expect(page.getByRole("button", { name: "NOTIFY ME" })).toBeVisible(
        {
          timeout: 5000,
        }
      );
      console.log("NOTIFY ME button is visible");
      await page
        .getByRole("button", { name: "NOTIFY ME" })
        .click({ timeout: 5000 });
      console.log("Clicked on 'NOTIFY ME' button");
      await expect(
        page.getByText("The OTP you entered is invalid")
      ).toBeVisible({
        timeout: 5000,
      });
      console.log("Invalid OTP message is visible");
      await expect(
        page.getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({
        timeout: 5000,
      });
      console.log("Verify OTP button is visible");
      await page
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 5000 });
      console.log("Clicked on 'Verify OTP' button");
      await expect(page.getByLabel("Enter OTP*")).toBeVisible({
        timeout: 5000,
      });
      console.log("Enter OTP field is visible");
      await page.getByLabel("Enter OTP*").click({ timeout: 5000 });
      console.log("Clicked on OTP field");
      const otpDetails = await fetchOtp();
      await page.getByLabel("Enter OTP*").fill(otpDetails.data.otp);
      console.log("Filled OTP with valid OTP");
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/v2/enrollment") && resp.status() === 200
        ),
        page
          .getByRole("button", { name: "NOTIFY ME" })
          .click({ timeout: 5000 }),
      ]);
      console.log("Clicked on 'NOTIFY ME' button");
      expect(response.ok()).toBeTruthy();
      console.log("Enrollment API response is successful");
      await expect(
        page.locator("#trial").getByText("Form submitted successfully!")
      ).toBeVisible({ timeout: 5000 });
      console.log("Success message is visible");
      const studentId = await fetchStudentIdByMobileAndEmail({
        mobileNumber:
          configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST,
        email: configs.TEST_CONSTANTS.TEST_USER_REGISTERED_EMAIL_FOR_OTP_TEST,
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(studentId).toBeTruthy();
      const activity = await verifyActivityLog({
        studentId: studentId!,
        name: "QA Lead",
        grade: "6",
        schoolIncludes: "New Enquiry for School - National Public School",
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(activity).toBeTruthy();
      console.log("Activity log verification successful");
      console.log(
        "Completed LANDING PAGE | TC - 3 : Get Started Form Invalid Field Validations"
      );
    });

    test("LANDING PAGE | TC - 4 : Find Your School Form Validation - Aligned Flow + Class UI + API Check", async ({
      page,
    }) => {
      console.log(
        "Starting LANDING PAGE | TC - 4 : Find Your School Form Validation - Aligned Flow + Class UI + API Check"
      );
      await page.goto(configs.TEST_CONSTANTS.UPRIO_URL);
      console.log("Navigated to Uprio homepage");
      await expect(
        page
          .getByLabel("Schools we are aligned with")
          .getByLabel("open medium modal")
      ).toBeVisible({ timeout: 5000 });
      console.log("Schools modal button is visible");
      await page
        .getByLabel("Schools we are aligned with")
        .getByLabel("open medium modal")
        .click({ timeout: 5000 });
      console.log("Clicked on schools modal button");
      await expect(
        page.locator("#forms-modal").getByRole("combobox")
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal city combobox is visible");
      await page
        .locator("#forms-modal")
        .getByRole("combobox")
        .click({ timeout: 5000 });
      console.log("Clicked on modal city combobox");
      await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible(
        {
          timeout: 5000,
        }
      );
      console.log("Search box is visible");
      await page
        .getByRole("searchbox", { name: "Search" })
        .click({ timeout: 5000 });
      console.log("Clicked on search box");
      await page.getByRole("searchbox", { name: "Search" }).fill("bangalore");
      console.log("Filled search with 'bangalore'");
      await expect(
        page.getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Bangalore option is visible");
      await page
        .getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
        .click({ timeout: 5000 });
      console.log("Clicked on Bangalore option");
      await expect(
        page
          .locator("#forms-modal")
          .getByRole("textbox", { name: "School name" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal school name textbox is visible");
      await page
        .locator("#forms-modal")
        .getByRole("textbox", { name: "School name" })
        .click({ timeout: 5000 });
      console.log("Clicked on modal school name textbox");
      await page
        .getByRole("option", {
          name: "National Public School (NPS) - JP Nagar",
        })
        .click({ timeout: 5000 });
      console.log("Clicked on NPS JP Nagar option");
      await expect(
        page.locator("#forms-modal").getByText("Grade 6")
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal Grade 6 option is visible");
      await page
        .locator("#forms-modal")
        .getByText("Grade 6")
        .click({ timeout: 5000 });
      console.log("Clicked on modal Grade 6");
      await expect(page.getByRole("button", { name: "NEXT" })).toBeVisible({
        timeout: 5000,
      });
      console.log("NEXT button is visible");
      await page.getByRole("button", { name: "NEXT" }).click({ timeout: 5000 });
      console.log("Clicked on 'NEXT' button");
      const schoolId = await fetchSchoolIdByName({
        cityId: 57933,
        schoolName: "National Public School (NPS) - JP Nagar",
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(schoolId).toBeTruthy();
      const scheduleRes = await fetch(
        `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/utilities/schools/${schoolId}/schedule`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
          },
        }
      );
      const scheduleJson = await scheduleRes.json();
      const classes = scheduleJson.docs;
      for (const klass of classes) {
        const chapterName = klass.chapterName;
        await expect(
          page.getByText(chapterName, { exact: true }).first()
        ).toBeVisible({ timeout: 5000 });
        console.log(`Verified first '${chapterName}' in UI`);
      }
      await expect(
        page.getByRole("button", { name: "START FOR FREE" })
      ).toBeVisible({ timeout: 5000 });
      console.log("START FOR FREE button is visible");
      await page
        .getByRole("button", { name: "START FOR FREE" })
        .click({ timeout: 5000 });
      console.log("Clicked on 'START FOR FREE' button");
      await expect(
        page.getByRole("textbox", { name: "Full name", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on modal full name textbox");
      await page
        .getByRole("textbox", { name: "Full name", exact: true })
        .fill("QA Lead");
      console.log("Filled modal full name with 'QA Lead'");
      await expect(
        page.getByRole("textbox", { name: "Mobile number", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal mobile number textbox is visible");
      await page
        .getByRole("textbox", { name: "Mobile number", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on modal mobile number textbox");
      await page
        .getByRole("textbox", { name: "Mobile number", exact: true })
        .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
      console.log("Filled modal mobile number");
      await expect(
        page.locator("#forms-modal").getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal Verify OTP button is visible");
      await page
        .locator("#forms-modal")
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 5000 });
      console.log("Clicked on modal 'Verify OTP' button");
      await expect(
        page.getByRole("textbox", { name: "Enter OTP", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal Enter OTP textbox is visible");
      await page
        .getByRole("textbox", { name: "Enter OTP", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on modal Enter OTP textbox");
      const otpDetails = await fetchOtp();
      await page
        .getByRole("textbox", { name: "Enter OTP", exact: true })
        .fill(otpDetails.data.otp);
      console.log("Filled modal OTP");
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/v2/enrollment") && resp.status() === 200
        ),
        page
          .getByRole("button", { name: "GET STARTED" })
          .click({ timeout: 5000 }),
      ]);
      console.log("Clicked on modal 'GET STARTED' button");
      expect(response.ok()).toBeTruthy();
      console.log("Enrollment API response is successful");
      await expect(
        page.locator("#forms-modal").getByText("Form submitted successfully!")
      ).toBeVisible({ timeout: 1000 });
      console.log("Modal success message is visible");
      const studentId = await fetchStudentIdByMobileAndEmail({
        mobileNumber:
          configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST,
        email: configs.TEST_CONSTANTS.TEST_USER_REGISTERED_EMAIL_FOR_OTP_TEST,
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(studentId).toBeTruthy();
      const activity = await verifyActivityLog({
        studentId: studentId!,
        name: "QA Lead",
        grade: "6",
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(activity).toBeTruthy();
      console.log("Activity log verification successful");
      console.log(
        "Completed LANDING PAGE | TC - 4: Find Your School Form Validation - Aligned Flow + Class UI + API Check"
      );
    });

    test("LANDING PAGE | TC - 5 : Find Your School Form Validation - Not Aligned Flow + API Check", async ({
      page,
    }) => {
      console.log(
        "Starting LANDING PAGE | TC - 5 : Find Your School Form Validation - Not Aligned Flow + API Check"
      );
      await page.goto(configs.TEST_CONSTANTS.UPRIO_URL);
      console.log("Navigated to UPRIO URL");
      await expect(
        page
          .getByLabel("Schools we are aligned with")
          .getByLabel("open medium modal")
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal open button is visible");
      await page
        .getByLabel("Schools we are aligned with")
        .getByLabel("open medium modal")
        .click({ timeout: 5000 });
      console.log("Clicked on modal open button");
      await expect(
        page.locator("#forms-modal").getByRole("combobox")
      ).toBeVisible({ timeout: 5000 });
      console.log("Combobox in modal is visible");
      await page
        .locator("#forms-modal")
        .getByRole("combobox")
        .click({ timeout: 5000 });
      console.log("Clicked on combobox");
      await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible(
        {
          timeout: 5000,
        }
      );
      console.log("Search box is visible");
      await page
        .getByRole("searchbox", { name: "Search" })
        .click({ timeout: 5000 });
      console.log("Clicked on search box");
      await page.getByRole("searchbox", { name: "Search" }).fill("delhi");
      console.log("Filled search box with delhi");
      await expect(
        page.getByRole("option", { name: "Central Delhi" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Central Delhi option is visible");
      await page
        .getByRole("option", { name: "Central Delhi" })
        .click({ timeout: 5000 });
      console.log("Clicked on Central Delhi option");
      await expect(
        page
          .locator("#forms-modal")
          .getByRole("textbox", { name: "School name" })
      ).toBeVisible({ timeout: 5000 });
      console.log("School name textbox is visible");
      await page
        .locator("#forms-modal")
        .getByRole("textbox", { name: "School name" })
        .click({ timeout: 5000 });
      console.log("Clicked on school name textbox");
      await page
        .locator("#forms-modal")
        .getByRole("textbox", { name: "School name" })
        .fill("Aadharshila Vidyapeeth");
      console.log("Filled school name with Aadharshila Vidyapeeth");
      await expect(
        page.locator("#forms-modal").getByText("Grade 6")
      ).toBeVisible({ timeout: 5000 });
      console.log("Grade 6 option is visible");
      await page
        .locator("#forms-modal")
        .getByText("Grade 6")
        .click({ timeout: 5000 });
      console.log("Clicked on Grade 6");
      await expect(page.getByRole("button", { name: "NEXT" })).toBeVisible({
        timeout: 5000,
      });
      console.log("NEXT button is visible");
      await page.getByRole("button", { name: "NEXT" }).click({ timeout: 5000 });
      console.log("Clicked on NEXT button");
      await expect(
        page.getByRole("textbox", { name: "Full name", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on full name textbox");
      await page
        .getByRole("textbox", { name: "Full name", exact: true })
        .fill("QA Lead");
      console.log("Filled full name with QA Lead");
      await expect(
        page
          .locator("#forms-modal")
          .getByRole("textbox", { name: "Mobile number* Mobile number*" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Mobile number textbox is visible");
      await page
        .locator("#forms-modal")
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .click({ timeout: 5000 });
      console.log("Clicked on mobile number textbox");
      await page
        .locator("#forms-modal")
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
      console.log("Filled mobile number");
      await expect(
        page.locator("#forms-modal").getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Verify OTP button is visible");
      await page
        .locator("#forms-modal")
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 5000 });
      console.log("Clicked on Verify OTP button");
      await expect(
        page.getByRole("textbox", { name: "Enter OTP", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Enter OTP textbox is visible");
      await page
        .getByRole("textbox", { name: "Enter OTP", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on Enter OTP textbox");
      const otpDetails = await fetchOtp();
      console.log("Fetched OTP details");
      await page
        .getByRole("textbox", { name: "Enter OTP", exact: true })
        .fill(otpDetails.data.otp);
      console.log("Filled OTP");
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/v2/enrollment") && resp.status() === 200
        ),
        page
          .locator("#forms-modal")
          .getByRole("button", { name: "NOTIFY ME" })
          .click({ timeout: 5000 }),
      ]);
      console.log("Clicked on NOTIFY ME button and waited for response");
      expect(response.ok()).toBeTruthy();
      console.log("Response status is OK");
      await expect(
        page.locator("#forms-modal").getByText("Form submitted successfully!")
      ).toBeVisible({ timeout: 1000 });
      console.log("Form submitted successfully message is visible");
      const studentId = await fetchStudentIdByMobileAndEmail({
        mobileNumber:
          configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST,
        email: configs.TEST_CONSTANTS.TEST_USER_REGISTERED_EMAIL_FOR_OTP_TEST,
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(studentId).toBeTruthy();
      const activity = await verifyActivityLog({
        studentId: studentId!,
        name: "QA Lead",
        grade: "6",
        schoolIncludes: "New Enquiry for School - Aadharshila Vidyapeeth",
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      console.log("Verified activity log");
      expect(activity).toBeTruthy();
      console.log("Activity log verification successful");
      console.log(
        "Completed LANDING PAGE | TC - 5: Find Your School Form Validation - Not Aligned Flow + API Check"
      );
    });
  });

  test.describe("Demo Lead Tests", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      `Test only for Chromium!`
    );
    test.afterEach(async () => {
      await cleanUpDemoLeadCreation(
        configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER
      );
    });
    test("LANDING PAGE | TC - 6 : Get Started Form Validation For Unregistered Number", async ({
      page,
    }) => {
      console.log(
        "Starting LANDING PAGE | TC - 6 : Get Started Form Validation"
      );
      await page.goto(`${configs.TEST_CONSTANTS.UPRIO_URL}/#trial`);
      console.log("Navigated to trial page");
      await expect(
        page.getByRole("textbox", { name: "Full name* Full name* Full" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .click({ timeout: 5000 });
      console.log("Clicked on full name textbox");
      await page
        .getByRole("textbox", { name: "Full name* Full name* Full" })
        .fill("QA Lead");
      console.log("Filled full name with QA Lead");
      await expect(
        page.getByRole("textbox", { name: "Mobile number* Mobile number*" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Mobile number textbox is visible");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .click({ timeout: 5000 });
      console.log("Clicked on mobile number textbox");
      await page
        .getByRole("textbox", { name: "Mobile number* Mobile number*" })
        .fill(configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER);
      console.log("Filled mobile number");
      await expect(
        page.getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({
        timeout: 5000,
      });
      console.log("Verify OTP button is visible");
      await page
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 5000 });
      console.log("Clicked on Verify OTP button");
      await expect(page.getByLabel("Enter OTP*")).toBeVisible({
        timeout: 5000,
      });
      console.log("Enter OTP field is visible");
      await page.getByLabel("Enter OTP*").click({ timeout: 5000 });
      console.log("Clicked on Enter OTP field");
      let getOtp = await fetch(
        `${configs.TEST_CONSTANTS.API_BASE_URL}` +
          "/api/v2/functional-tests-helper/otp",
        {
          method: "POST",
          body: JSON.stringify({
            mobileNumber: configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
          },
        }
      );
      const otpDetails = await getOtp.json();
      console.log("Fetched OTP details");
      console.log(otpDetails);
      if (otpDetails && otpDetails.data && otpDetails.data.otp) {
        await page.getByLabel("Enter OTP*").fill(otpDetails.data.otp);
        console.log("Filled OTP");
      } else {
        test.fail();
      }
      await expect(page.getByRole("combobox")).toBeVisible({ timeout: 5000 });
      console.log("Combobox is visible");
      await page.getByRole("combobox").click({ timeout: 5000 });
      console.log("Clicked on combobox");
      await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible(
        {
          timeout: 5000,
        }
      );
      console.log("Search box is visible");
      await page
        .getByRole("searchbox", { name: "Search" })
        .click({ timeout: 5000 });
      console.log("Clicked on search box");
      await page.getByRole("searchbox", { name: "Search" }).fill("bangalore");
      console.log("Filled search box with bangalore");
      await expect(
        page.getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Bengaluru option is visible");
      await page
        .getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
        .click({ timeout: 5000 });
      console.log("Clicked on Bengaluru option");
      await expect(
        page.getByRole("textbox", { name: "School name" })
      ).toBeVisible({ timeout: 5000 });
      console.log("School name textbox is visible");
      await page
        .getByRole("textbox", { name: "School name" })
        .click({ timeout: 5000 });
      console.log("Clicked on school name textbox");
      await page
        .getByRole("option", { name: "National Public School - Agara" })
        .click({ timeout: 5000 });
      console.log("Clicked on National Public School - Agara option");
      await expect(page.locator("#trial").getByText("Grade 6")).toBeVisible({
        timeout: 5000,
      });
      console.log("Grade 6 option is visible");
      await page
        .locator("#trial")
        .getByText("Grade 6")
        .click({ timeout: 5000 });
      console.log("Clicked on Grade 6");
      await expect(
        page.getByRole("button", { name: "GET STARTED" })
      ).toBeEnabled({ timeout: 5000 });
      console.log("GET STARTED button is now enabled");
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/v2/enrollment") && resp.status() === 200
        ),
        page
          .getByRole("button", { name: "GET STARTED" })
          .click({ timeout: 5000 }),
      ]);
      console.log("Clicked on GET STARTED button and waited for response");
      expect(response.ok()).toBeTruthy();
      console.log("Response status is OK");
      await expect(
        page.locator("#trial").getByText("Form submitted successfully!")
      ).toBeVisible({ timeout: 5000 });
      console.log("Form submitted successfully message is visible");
      const studentApiRes = await fetch(
        `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/students?mobileNumber=${configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
          },
        }
      );
      const studentJson = await studentApiRes.json();
      console.log("Fetched student records");
      const studentRecord = studentJson.docs.find(
        (doc) =>
          doc.firstName === "QA" &&
          doc.lastName === "Lead" &&
          doc.gradeName === "6" &&
          doc.schoolDetails?.name === "National Public School - Agara" &&
          doc.cityDetails?.name === "Bengaluru (Bangalore Urban)" &&
          doc.leadSource === "website"
      );
      expect(studentRecord).toBeTruthy();
      console.log("Student record validation successful");
      console.log(
        "Completed LANDING PAGE | TC - 6 : Get Started Form Validation For Unregistered Number"
      );
    });

    test("LANDING PAGE | TC - 7 : Find Your School Form Validation - New Lead", async ({
      page,
    }) => {
      console.log(
        "Starting LANDING PAGE | TC - 7 : Find Your School Form Validation - New Lead"
      );
      await page.goto(configs.TEST_CONSTANTS.UPRIO_URL);
      console.log("Navigated to UPRIO URL");
      await expect(
        page
          .getByLabel("Schools we are aligned with")
          .getByLabel("open medium modal")
      ).toBeVisible({ timeout: 5000 });
      console.log("Modal open button is visible");
      await page
        .getByLabel("Schools we are aligned with")
        .getByLabel("open medium modal")
        .click({ timeout: 5000 });
      console.log("Clicked on modal open button");
      await expect(
        page.locator("#forms-modal").getByRole("combobox")
      ).toBeVisible({ timeout: 5000 });
      console.log("Combobox in modal is visible");
      await page
        .locator("#forms-modal")
        .getByRole("combobox")
        .click({ timeout: 5000 });
      console.log("Clicked on combobox");
      await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible(
        {
          timeout: 5000,
        }
      );
      console.log("Search box is visible");
      await page
        .getByRole("searchbox", { name: "Search" })
        .click({ timeout: 5000 });
      console.log("Clicked on search box");
      await page.getByRole("searchbox", { name: "Search" }).fill("bangalore");
      console.log("Filled search box with bangalore");
      await expect(
        page.getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Bengaluru option is visible");
      await page
        .getByRole("option", { name: "Bengaluru (Bangalore Urban)" })
        .click({ timeout: 5000 });
      console.log("Clicked on Bengaluru option");
      await expect(
        page
          .locator("#forms-modal")
          .getByRole("textbox", { name: "School name" })
      ).toBeVisible({ timeout: 5000 });
      console.log("School name textbox is visible");
      await page
        .locator("#forms-modal")
        .getByRole("textbox", { name: "School name" })
        .click({ timeout: 5000 });
      console.log("Clicked on school name textbox");
      await page
        .getByRole("option", {
          name: "National Public School (NPS) - JP Nagar",
        })
        .click({ timeout: 5000 });
      console.log("Clicked on National Public School (NPS) - JP Nagar option");
      await expect(
        page.locator("#forms-modal").getByText("Grade 6")
      ).toBeVisible({ timeout: 5000 });
      console.log("Grade 6 option is visible");
      await page
        .locator("#forms-modal")
        .getByText("Grade 6")
        .click({ timeout: 5000 });
      console.log("Clicked on Grade 6");
      await expect(page.getByRole("button", { name: "NEXT" })).toBeVisible({
        timeout: 5000,
      });
      console.log("NEXT button is visible");
      await page.getByRole("button", { name: "NEXT" }).click({ timeout: 5000 });
      console.log("Clicked on NEXT button");
      const schoolId = await fetchSchoolIdByName({
        cityId: 57933,
        schoolName: "National Public School (NPS) - JP Nagar",
        apiKey: configs.TEST_CONSTANTS.X_API_KEY,
        baseUrl: configs.TEST_CONSTANTS.API_BASE_URL,
      });
      expect(schoolId).toBeTruthy();
      const scheduleRes = await fetch(
        `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/utilities/schools/${schoolId}/schedule`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
          },
        }
      );
      const scheduleJson = await scheduleRes.json();
      const classes = scheduleJson.docs;
      console.log("Fetched school schedule");
      for (const klass of classes) {
        const chapterName = klass.chapterName;
        await expect(
          page.getByText(chapterName, { exact: true }).first()
        ).toBeVisible({ timeout: 5000 });
        console.log(`Verified first '${chapterName}' in UI`);
      }
      await expect(
        page.getByRole("button", { name: "START FOR FREE" })
      ).toBeVisible({ timeout: 5000 });
      console.log("START FOR FREE button is visible");
      await page
        .getByRole("button", { name: "START FOR FREE" })
        .click({ timeout: 5000 });
      console.log("Clicked on START FOR FREE button");
      await expect(
        page.getByRole("textbox", { name: "Full name", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Full name textbox is visible");
      await page
        .getByRole("textbox", { name: "Full name", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on full name textbox");
      await page
        .getByRole("textbox", { name: "Full name", exact: true })
        .fill("QA Lead");
      console.log("Filled full name with QA Lead");
      await expect(
        page.getByRole("textbox", { name: "Mobile number", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Mobile number textbox is visible");
      await page
        .getByRole("textbox", { name: "Mobile number", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on mobile number textbox");
      await page
        .getByRole("textbox", { name: "Mobile number", exact: true })
        .fill(configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER);
      console.log("Filled mobile number");
      await expect(
        page.locator("#forms-modal").getByRole("button", { name: "Verify OTP" })
      ).toBeVisible({ timeout: 5000 });
      console.log("Verify OTP button is visible");
      await page
        .locator("#forms-modal")
        .getByRole("button", { name: "Verify OTP" })
        .click({ timeout: 5000 });
      console.log("Clicked on Verify OTP button");
      await expect(
        page.getByRole("textbox", { name: "Enter OTP", exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("Enter OTP textbox is visible");
      await page
        .getByRole("textbox", { name: "Enter OTP", exact: true })
        .click({ timeout: 5000 });
      console.log("Clicked on Enter OTP textbox");
      let getOtp = await fetch(
        `${configs.TEST_CONSTANTS.API_BASE_URL}` +
          "/api/v2/functional-tests-helper/otp",
        {
          method: "POST",
          body: JSON.stringify({
            mobileNumber: configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
          },
        }
      );
      const otpDetails = await getOtp.json();
      console.log("Fetched OTP details");
      console.log(otpDetails);
      if (otpDetails && otpDetails.data && otpDetails.data.otp) {
        await page
          .getByRole("textbox", { name: "Enter OTP", exact: true })
          .fill(otpDetails.data.otp);
        console.log("Filled OTP");
      } else {
        test.fail();
      }
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/v2/enrollment") && resp.status() === 200
        ),
        page
          .getByRole("button", { name: "GET STARTED" })
          .click({ timeout: 5000 }),
      ]);
      console.log("Clicked on GET STARTED button and waited for response");
      expect(response.ok()).toBeTruthy();
      console.log("Response status is OK");
      await expect(
        page.locator("#forms-modal").getByText("Form submitted successfully!")
      ).toBeVisible({ timeout: 1000 });
      console.log("Form submitted successfully message is visible");
      const studentApiRes = await fetch(
        `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/students?mobileNumber=${configs.TEST_CONSTANTS.TEST_USER_LANDING_PAGE_NUMBER}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
          },
        }
      );
      const studentJson = await studentApiRes.json();
      console.log("Fetched student records");
      const studentRecord = studentJson.docs.find(
        (doc) =>
          doc.firstName === "QA" &&
          doc.lastName === "Lead" &&
          doc.gradeName === "6" &&
          doc.schoolDetails?.name ===
            "National Public School (NPS) - JP Nagar" &&
          doc.cityDetails?.name === "Bengaluru (Bangalore Urban)" &&
          doc.leadSource === "website"
      );
      expect(studentRecord).toBeTruthy();
      console.log("Student record validation successful");
      console.log(
        "Completed LANDING PAGE | TC - 7: Find Your School Form Validation - New Lead"
      );
    });
  });

  test("LANDING PAGE | TC - 8 : Tutor Job Enquiry Test Case", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName.toLowerCase() !== "chromium",
      `Test only for Chromium!`
    );
    console.log("Starting LANDING PAGE | TC - 8 : Tutor Job Enquiry Test Case");
    await page.goto(configs.TEST_CONSTANTS.UPRIO_URL);
    console.log("Navigated to UPRIO URL");
    await expect(
      page.getByRole("link", { name: "Become a Tutor" })
    ).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Become a Tutor' link is visible");
    await page
      .getByRole("link", { name: "Become a Tutor" })
      .click({ timeout: 5000 });
    console.log("Clicked on 'Become a Tutor' link");
    await page.waitForTimeout(5000);
    await expect(page.getByPlaceholder("Full name")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Full name' placeholder is visible");
    await page.getByPlaceholder("Full name").click({ timeout: 5000 });
    console.log("Clicked on 'Full name' field");
    await expect(page.getByText("Apply as a tutor Form")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Apply as a tutor Form' text is visible");
    await page.getByText("Apply as a tutor Form").click({ timeout: 5000 });
    console.log("Clicked on 'Apply as a tutor Form' text");
    await expect(page.getByText("Enter your full name.")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Enter your full name.' validation text is visible");
    await expect(page.getByPlaceholder("Full name")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Full name' placeholder is visible again");
    await page.getByPlaceholder("Full name").click({ timeout: 5000 });
    console.log("Clicked on 'Full name' field again");
    await page.getByPlaceholder("Full name").fill("QA Test Tutor");
    console.log("Filled 'Full name' field with 'QA Test Tutor'");
    await expect(page.getByPlaceholder("Email address")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Email address' placeholder is visible");
    await page.getByPlaceholder("Email address").click({ timeout: 5000 });
    console.log("Clicked on 'Email address' field");
    await expect(page.getByText("Apply as a tutor Form")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Apply as a tutor Form' text is visible again");
    await page.getByText("Apply as a tutor Form").click({ timeout: 5000 });
    console.log("Clicked on 'Apply as a tutor Form' text again");
    await expect(page.getByText("Enter your email address.")).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "Verified 'Enter your email address.' validation text is visible"
    );
    await expect(page.getByPlaceholder("Email address")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Email address' placeholder is visible again");
    await page.getByPlaceholder("Email address").click({ timeout: 5000 });
    console.log("Clicked on 'Email address' field again");
    await page.getByPlaceholder("Email address").fill("qa@uprio");
    console.log("Filled 'Email address' field with invalid email 'qa@uprio'");
    await expect(page.getByText("Apply as a tutor Form")).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "Verified 'Apply as a tutor Form' text is visible for email validation"
    );
    await page.getByText("Apply as a tutor Form").click({ timeout: 5000 });
    console.log("Clicked on 'Apply as a tutor Form' text for email validation");
    await expect(page.getByText("Enter a valid email address.")).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "Verified 'Enter a valid email address.' validation text is visible"
    );
    await expect(page.getByPlaceholder("Email address")).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "Verified 'Email address' placeholder is visible for correction"
    );
    await page.getByPlaceholder("Email address").click({ timeout: 5000 });
    console.log("Clicked on 'Email address' field for correction");
    await page.getByPlaceholder("Email address").fill("qa@uprio.com");
    console.log("Filled 'Email address' field with valid email 'qa@uprio.com'");
    await expect(page.getByLabel("Mobile number*")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Mobile number*' label is visible");
    await page.getByLabel("Mobile number*").click({ timeout: 5000 });
    console.log("Clicked on 'Mobile number*' field");
    await expect(page.getByText("Apply as a tutor Form")).toBeVisible({
      timeout: 5000,
    });
    console.log(
      "Verified 'Apply as a tutor Form' text is visible for mobile validation"
    );
    await page.getByText("Apply as a tutor Form").click({ timeout: 5000 });
    console.log(
      "Clicked on 'Apply as a tutor Form' text for mobile validation"
    );
    await expect(
      page.getByText("Enter your mobile number.").nth(1)
    ).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified mobile number validation text is visible");
    await expect(page.getByLabel("Mobile number*")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Mobile number*' label is visible again");
    await page.getByLabel("Mobile number*").click({ timeout: 5000 });
    console.log("Clicked on 'Mobile number*' field again");
    await page.getByLabel("Mobile number*").fill("12345");
    console.log("Filled 'Mobile number*' field with invalid number '12345'");
    await expect(page.getByText("Maths")).toBeVisible({ timeout: 5000 });
    console.log("Verified 'Maths' subject is visible");
    await page.getByText("Maths").click({ timeout: 5000 });
    console.log("Clicked on 'Maths' subject");
    await expect(page.getByText("Number must be 10 digits.")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified '10 digits' validation message is visible");
    await expect(page.getByLabel("Mobile number*")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified 'Mobile number*' label is visible for correction");
    await page.getByLabel("Mobile number*").click({ timeout: 5000 });
    console.log("Clicked on 'Mobile number*' field for correction");
    await page
      .getByLabel("Mobile number*")
      .fill(configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST);
    console.log("Filled 'Mobile number*' field with valid test number");
    await expect(page.getByText("Maths")).toBeVisible({ timeout: 5000 });
    console.log("Verified 'Maths' subject is visible for selection");
    await page.getByText("Maths").click({ timeout: 5000 });
    console.log("Selected 'Maths' subject");
    const filePath = path.join(__dirname, "../fixtures/sample_file.pdf");
    await page.setInputFiles('input[type="file"]', filePath);
    console.log("Uploaded sample PDF file");
    await expect(page.getByRole("button", { name: "JOIN US" })).toBeEnabled({
      timeout: 5000,
    });
    console.log("JOIN US button is now enabled");
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v2/tutor-job-enquiries/submit") &&
          resp.status() === 200
      ),
      page.getByRole("button", { name: "JOIN US" }).click({ timeout: 5000 }),
    ]);
    console.log("Clicked 'JOIN US' button and waited for API response");
    expect(response.ok()).toBeTruthy();
    console.log("Verified API response is successful");
    await expect(page.getByText("Form submitted successfully!")).toBeVisible({
      timeout: 5000,
    });
    console.log("Verified form submission success message is visible");
    const enquiryResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/tutor-job-enquiries?filter[emailAddress]=qa@uprio.com`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
        },
      }
    );
    console.log("Fetched tutor job enquiries from API", enquiryResponse);
    const enquiryJson = await enquiryResponse.json();
    const latestEnquiry = enquiryJson.docs.find(
      (enquiry) => enquiry.emailAddress === "qa@uprio.com"
    );
    expect(latestEnquiry).toBeTruthy();
    console.log("Verified latest enquiry exists in API response");
    expect(latestEnquiry.name).toBe("QA Test Tutor");
    console.log("Verified enquiry name matches expected value");
    expect(latestEnquiry.resumeUrl).toContain("qa%40uprio.com");
    console.log("Verified resume URL contains expected email");
    expect(latestEnquiry.subjects[0].subjectName).toBe("Maths");
    console.log("Verified selected subject is Maths");
    const cleanupResponse = await fetch(
      `${configs.TEST_CONSTANTS.API_BASE_URL}/api/v2/functional-tests-helper/landing-page/tutor-job-enquiries?mobileNumber=${configs.TEST_CONSTANTS.TEST_USER_REGISTERED_NUMBER_FOR_OTP_TEST}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": configs.TEST_CONSTANTS.X_API_KEY,
        },
      }
    );
    expect(cleanupResponse.status).toBe(200);
    console.log("Successfully cleaned up test data");
    console.log(
      "Completed LANDING PAGE | TC - 8 : Tutor Job Enquiry Test Case"
    );
  });
});
