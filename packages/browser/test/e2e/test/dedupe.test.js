const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { getSentryEvents } = require('./utils/helpers');

test.describe('Dedupe Integration', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test(`doesn't drop message event if it has a different message from previous`, async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      [0, 1].forEach(idx => {
        Sentry.captureMessage(`test_${idx}`);
      });
    });

    expect(browserEvents).toHaveLength(2);
  });

  test('drops duplicate event if it has the same message as previous', async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      [0, 1].forEach(() => {
        Sentry.captureMessage('test');
      });
    });

    expect(browserEvents).toHaveLength(1);
  });

  test(`drops separately thrown exceptions of the same type and message`, async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      [0, 1].forEach(() => {
        Sentry.captureException(Error('test'));
      });
    });

    expect(browserEvents).toHaveLength(1);
  });

  test('drops duplicate exception if it has the same fingerprint as previous', async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      const testError = Error('test');

      [0, 1].forEach(() => {
        Sentry.captureException(testError);
      });
    });

    expect(browserEvents).toHaveLength(1);
  });
});
