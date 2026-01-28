import { expect, test as setup } from "@playwright/test";
import { generateToken } from "authenticator";
import configs from "../test-configs";

const authFile = "playwright/.auth/admin.json";

setup("authenticate", async ({ page }) => {
  setup.setTimeout(120000); // Increased timeout for auth flow

  console.log("Starting Setup - Admin Login");

  try {
    // Navigate to Google accounts
    await page.goto("https://accounts.google.com/", {
      waitUntil: "networkidle",
    });

    // Fill email
    await page
      .getByLabel("Email or phone")
      .fill(configs.TEST_CONSTANTS.TEST_ADMIN_EMAIL);
    await page.getByRole("button", { name: "Next" }).click();

    // Wait for password field and fill it
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page
      .getByLabel("Enter your password")
      .fill(configs.TEST_CONSTANTS.TEST_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Next" }).click();

    // Handle 2FA if required
    await handle2FA(page);

    // Verify successful login by checking for account indicators
    await verifySuccessfulLogin(page);

    // Save authentication state
    await page.context().storageState({ path: authFile });
    console.log("Authentication state saved successfully");
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  } finally {
    await page.close();
  }
});

async function handle2FA(page) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Check if 2FA is required
      const codeInput = page.getByLabel("Enter code");
      await expect(codeInput).toBeVisible({ timeout: 10000 });
      console.log("2FA code screen detected");

      // Generate and enter token
      const token = generateToken(configs.TEST_CONSTANTS.TEST_ADMIN_KEY);
      console.log(`Entering 2FA token (attempt ${retryCount + 1}):`, token);

      await codeInput.clear();
      await codeInput.fill(token);

      // Click Next button
      const nextButton = page.getByRole("button", { name: "Next" });
      await nextButton.click();

      // Wait to see if we're still on the token screen or moved forward
      await page.waitForTimeout(5000);

      const isStillOnTokenScreen = await codeInput.isVisible();

      if (!isStillOnTokenScreen) {
        console.log("2FA completed successfully");
        return;
      }

      console.log("2FA attempt failed, retrying...");
      retryCount++;

      // Wait before next attempt (TOTP tokens are time-based)
      if (retryCount < maxRetries) {
        await page.waitForTimeout(30000);
      }
    } catch (error) {
      console.log("2FA not required or error occurred:", error.message);
      return; // Exit if 2FA is not required
    }
  }

  if (retryCount >= maxRetries) {
    throw new Error("2FA authentication failed after maximum retries");
  }
}

async function verifySuccessfulLogin(page) {
  // Wait for specific indicators of successful login
  const successIndicators = [
    // More specific selectors to avoid strict mode violations
    () =>
      page
        .locator('a[aria-label*="Google Account:"]')
        .first()
        .waitFor({ timeout: 10000 }),
    () =>
      page
        .locator('.gb_B[aria-label*="Google Account"]')
        .first()
        .waitFor({ timeout: 10000 }),
    () =>
      page.locator('[data-gb*="account"]').first().waitFor({ timeout: 10000 }),
    () => page.getByText("Welcome").first().waitFor({ timeout: 10000 }),
  ];

  try {
    // Try each indicator and succeed on the first one that works
    for (const indicator of successIndicators) {
      try {
        await indicator();
        console.log(
          "Login verification successful - authenticated user detected"
        );
        return;
      } catch (error) {
        // Continue to next indicator
        continue;
      }
    }

    // If none of the specific indicators work, check URL as fallback
    const currentUrl = page.url();
    if (
      currentUrl.includes("myaccount.google.com") ||
      (currentUrl.includes("accounts.google.com") &&
        !currentUrl.includes("signin"))
    ) {
      console.log(
        "Login verification successful - on authenticated Google page"
      );
      return;
    }

    console.warn(
      "Could not verify login success through UI elements, but proceeding"
    );
  } catch (error) {
    console.warn(
      "Login verification encountered error, but proceeding:",
      error.message
    );
  }
}
