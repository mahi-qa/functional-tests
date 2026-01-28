import { Page, expect } from "@playwright/test";
import configs from "../test-configs";
import { retryOperation } from "../helper/setup";

export async function loginAsStudentPracticeSheetFT(page: Page) {
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
    },
    3,
    5000
  );
}
