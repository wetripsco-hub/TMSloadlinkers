import { test as base, expect } from '@playwright/test';
import { captureConsoleErrors, type CapturedConsoleError } from './helpers/console';

interface Fixtures {
  consoleErrors: CapturedConsoleError[];
}

// Every spec gets automatic console/pageerror capture, and the collected
// errors are attached to the test result (so the audit-summary script can
// read them back out of the JSON reporter output) even on a passing test.
export const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use, testInfo) => {
    const errors = captureConsoleErrors(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(errors);
    if (errors.length > 0) {
      await testInfo.attach('console-errors', {
        body: JSON.stringify(errors, null, 2),
        contentType: 'application/json',
      });
    }
  },
});

export { expect };
