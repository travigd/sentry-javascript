const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { getSentryEvents } = require('./utils/helpers');

test.describe('window.onerror', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test('should catch syntax errors', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      eval('foo{};');
    });

    expect(eventData[0].exception.values[0].type).toMatch(/SyntaxError/);
    // Frame count test is skipped for this one
    // because what we get from an `eval` inside `getSentryEvents`
    // is not just from `eval`'s context.
  });
  test('should catch thrown strings', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      function throwStringError() {
        throw 'stringError';
      }

      throwStringError();
    });

    expect(eventData[0].exception.values[0].value).toMatch(/stringError$/);
    expect(eventData[0].exception.values[0].stacktrace.frames).toHaveLength(1);
    expect(eventData[0].exception.values[0].stacktrace.frames[0]['function']).toMatch(
      /throwStringError|\?|global code/i,
    );
  });

  test('should catch thrown objects', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      function throwObjectError() {
        // never do this; just making sure Raven.js handles this case
        // gracefully2
        throw { error: 'stuff is broken', somekey: 'ok' };
      }

      throwObjectError();
    });

    expect(eventData[0].exception.values[0].value).toBe('Non-Error exception captured with keys: error, somekey');
    expect(eventData[0].exception.values[0].stacktrace.frames).toHaveLength(1);
    expect(eventData[0].exception.values[0].stacktrace.frames[0]['function']).toMatch(
      /throwObjectError|\?|global code/i,
    );
  });

  test('should catch thrown errors', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      function throwRealError() {
        throw new Error('realError');
      }
      throwRealError();
    });

    expect(eventData[0].exception.values[0].type).toMatch(/^Error/);
    expect(eventData[0].exception.values[0].value).toMatch(/realError$/);
    // FIXME: Frames inconsistent due to how `getSentryEvents` injects code into browser.
    // expect(eventData[0].exception.values[0].stacktrace.frames.length).toBeGreaterThanOrEqual(1);
    // expect(eventData[0].exception.values[0].stacktrace.frames.length).toBeLessThanOrEqual(2);
    // expect(eventData[0].exception.values[0].stacktrace.frames[0]['function']).toMatch(/\?|global code|throwRealError/i);
  });

  test('should onerror calls with non-string first argument gracefully', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      window.onerror({
        type: 'error',
        otherKey: 'hi',
      });
    });

    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('Non-Error exception captured with keys: otherKey, type');
    expect(eventData[0].extra.__serialized__).toMatchObject({
      type: 'error',
      otherKey: 'hi',
    });
  });

  test('should NOT catch an exception already caught [but rethrown] via Sentry.captureException', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      try {
        // eslint-disable-next-line no-undef
        foo();
      } catch (e) {
        Sentry.captureException(e);
        throw e; // intentionally re-throw
      }
    });

    expect(eventData).toHaveLength(1);
  });
});
