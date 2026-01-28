import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

interface TestInfo {
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted" | "flaky";
  duration: number;
  file: string;
  project: string;
}

class CustomSlackReporter implements Reporter {
  private allTestResults = new Map<string, TestResult[]>();
  private testMetadata = new Map<string, TestCase>();
  private finalTests: TestInfo[] = [];
  private startTime: number = 0;
  private totalTests: number = 0; // Track total tests from suite

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;
    console.log(`Starting the run with ${this.totalTests} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const key = test.id;
    console.log(`onTestEnd: ${test.title} | Status: ${result.status} | Project: ${test.parent?.project()?.name}`);
    
    if (!this.allTestResults.has(key)) {
      this.allTestResults.set(key, []);
      this.testMetadata.set(key, test);
    }
    this.allTestResults.get(key)!.push(result);
  }

  async onEnd(result: FullResult) {
    console.log(`Total test entries to process: ${this.allTestResults.size}`);
    console.log(`Playwright reports - Status: ${result.status}`);
    
    for (const [testId, results] of this.allTestResults.entries()) {
      const test = this.testMetadata.get(testId)!;
      
      // Determine final status: if any attempt passed after failures, it's flaky
      // If all attempts failed, it's failed
      // If all attempts passed, it's passed
      let finalStatus: "passed" | "failed" | "timedOut" | "skipped" | "interrupted" | "flaky" = results[results.length - 1].status;
      
      // Check if test is flaky (failed at least once but eventually passed)
      const hadFailures = results.some(r => r.status === 'failed' || r.status === 'timedOut');
      const eventuallyPassed = results.some(r => r.status === 'passed');
      
      if (hadFailures && eventuallyPassed) {
        finalStatus = "flaky" as const;
      } else if (hadFailures && !eventuallyPassed) {
        finalStatus = "failed";
      }

      const testInfo: TestInfo = {
        title: test.title,
        status: finalStatus,
        duration: results[results.length - 1].duration,
        file: test.location.file.split("/").pop() || "unknown",
        project: test.parent?.project()?.name || "unknown",
      };

      console.log(`Test: ${test.title} | Final Status: ${finalStatus} | Results: ${results.map(r => r.status).join(', ')} | Project: ${testInfo.project}`);
      this.finalTests.push(testInfo);
    }

    const duration = Date.now() - this.startTime;
    await this.sendToSlack(result, duration);
  }

  private async sendToSlack(result: FullResult, duration: number) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log("No Slack webhook URL provided, skipping Slack notification");
      return;
    }

    // Count tests by status
    const passed = this.finalTests.filter((t) => t.status === "passed").length;
    const failed = this.finalTests.filter((t) => t.status === "failed").length;
    const skipped = this.finalTests.filter(
      (t) => t.status === "skipped"
    ).length;
    const flaky = this.finalTests.filter((t) => t.status === "flaky").length;

    // Calculate browser-specific stats
    const chromiumTests = this.finalTests.filter((t) => t.project === "chromium");
    const firefoxTests = this.finalTests.filter((t) => t.project === "firefox");
    const webkitTests = this.finalTests.filter((t) => t.project === "webkit");

    const totalRan = this.finalTests.length;
    const totalExpected = this.totalTests;

    const failedTests = this.finalTests.filter((t) => t.status === "failed");
    const flakyTests = this.finalTests.filter((t) => t.status === "flaky");
    const testName = process.env.TEST_NAME || "Playwright Tests";

    // Extract just the test type, removing environment prefix
    let testType = testName;

    if (testName.includes(": ")) {
      const parts = testName.split(": ");
      testType = parts[1];
    } else if (testName.includes(" | ")) {
      const parts = testName.split(" | ");
      testType = parts[0];
    }

    // Determine overall status - FIXED: Properly handle failed vs flaky
    console.log(`Test counts - Passed: ${passed}, Failed: ${failed}, Flaky: ${flaky}, Skipped: ${skipped}`);
    
    let overallStatus: string;
    let statusIcon: string;

    if (failed > 0) {
      overallStatus = "FAILED";
      statusIcon = ":x:";
    } else if (flaky > 0) {
      overallStatus = "PASSED (with warnings)";
      statusIcon = ":large_yellow_circle:";
    } else {
      overallStatus = "PASSED";
      statusIcon = ":white_check_mark:";
    }

    // Create detailed status message - use just test type
    let messageText = `*${testType}*\n`;
    messageText += `Status: ${statusIcon} ${overallStatus}\n`;
    messageText += `Total Tests: ${totalExpected} | Ran: ${totalRan} | Skipped: ${skipped}\n`;
    
    // Add browser breakdown if multiple browsers
    const browsers = [...new Set(this.finalTests.map(t => t.project))];
    if (browsers.length > 1) {
      messageText += `Browsers: ${browsers.join(", ")}\n`;
    }
    
    messageText += `Results:\n`;
    messageText += `- :white_check_mark: Passed: ${passed}\n`;

    if (failed > 0) messageText += `- :x: Failed: ${failed}\n`;
    if (flaky > 0) messageText += `- :large_yellow_circle: Flaky: ${flaky}\n`;
    if (skipped > 0) {
      messageText += `- :fast_forward: Skipped: ${skipped}`;
      // Add context about skipping
      if (skipped > totalRan) {
        messageText += ` (likely browser-specific skips)\n`;
      } else {
        messageText += `\n`;
      }
    }

    // Show failed tests details first (highest priority)
    if (failed > 0) {
      messageText += `\n:x: *Failed Tests (${failed}):*\n`;
      failedTests.forEach((test) => {
        messageText += `- ${test.title} (${test.project})\n`;
      });
    }

    // Show flaky tests (medium priority)
    if (flaky > 0) {
      messageText += `\n:large_yellow_circle: *Flaky Tests (${flaky}):*\n`;
      flakyTests.forEach((test) => {
        messageText += `- ${test.title} (${test.project})\n`;
      });
    }

    messageText += `\nDuration: ${Math.round(duration / 1000)}s`;

    // FIXED: Create header showing actual status - failed tests should show as failed
    let headerText: string;
    if (failed > 0) {
      headerText = `${testType} ${statusIcon} (${failed} failed, ${passed} passed of ${totalRan} ran)`;
    } else if (flaky > 0) {
      headerText = `${testType} ${statusIcon} (${flaky} flaky, ${passed} passed of ${totalRan} ran)`;
    } else {
      headerText = `${testType} ${statusIcon} (${passed}/${totalRan} passed)`;
    }

    const message = {
      text: headerText,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: headerText,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: messageText,
          },
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to send Slack notification:",
          response.statusText
        );
        console.error("Error details:", errorText);
      } else {
        console.log("Slack notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending Slack notification:", error);
    }
  }
}

export default CustomSlackReporter;