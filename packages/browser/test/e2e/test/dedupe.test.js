const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { getSentryEvents } = require('./utils/helpers');

test.describe('Dedupe Integration', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test(`doesn't drop message event if it has a different message from previous`, async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      Sentry.captureMessage('test_0');
      Sentry.captureMessage('test_1');
    });

    expect(browserEvents).toHaveLength(2);
  });

  test('drops duplicate event if it has the same message as previous', async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      Sentry.captureMessage('test');
      Sentry.captureMessage('test');
    });

    expect(browserEvents).toHaveLength(1);
  });

  test(`doesn't drop separately thrown exceptions of the same type and message`, async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      Sentry.captureException(Error('test'));
      Sentry.captureException(Error('test'));
    });

    expect(browserEvents).toHaveLength(2);
  });

  test('drops duplicate exception if it has the same fingerprint as previous', async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      const testError = Error('test');

      Sentry.captureException(testError);
      Sentry.captureException(testError);
    });

    expect(browserEvents).toHaveLength(1);
  });

  test(`doesn't drop duplicate exception if it has a different fingerprint from previous`, async ({ page }) => {
    const browserEvents = await getSentryEvents(page, () => {
      const testError = Error('test');

      Sentry.captureException(testError, { fingerprint: '0' });
      Sentry.captureException(testError, { fingerprint: '1' });
    });

    expect(browserEvents).toHaveLength(2);
  });
});
