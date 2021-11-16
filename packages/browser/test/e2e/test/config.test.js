const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { getSentryEvents } = require('./utils/helpers');

test.describe('config', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test('should allow to ignore specific errors', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      Sentry.captureException(new Error('foo'));
      Sentry.captureException(new Error('ignoreErrorTest'));
      Sentry.captureException(new Error('bar'));
    });

    expect(eventData).toHaveLength(2);
    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('foo');
    expect(eventData[1].exception.values[0].type).toBe('Error');
    expect(eventData[1].exception.values[0].value).toBe('bar');
  });

  test('should allow to ignore specific urls', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      /**
       * We always filter on the caller, not the cause of the error
       *
       * > foo.js file called a function in bar.js
       * > bar.js file called a function in baz.js
       * > baz.js threw an error
       *
       * foo.js is denied in the `init` call (init.js), thus we filter it
       * */
      const urlWithDeniedUrl = new Error('filter');
      urlWithDeniedUrl.stack =
        'Error: bar\n' +
        ' at http://localhost:5000/foo.js:7:19\n' +
        ' at bar(http://localhost:5000/bar.js:2:3)\n' +
        ' at baz(http://localhost:5000/baz.js:2:9)\n';

      /**
       * > foo-pass.js file called a function in bar-pass.js
       * > bar-pass.js file called a function in baz-pass.js
       * > baz-pass.js threw an error
       *
       * foo-pass.js is *not* denied in the `init` call (init.js), thus we don't filter it
       * */
      const urlWithoutDeniedUrl = new Error('pass');
      urlWithoutDeniedUrl.stack =
        'Error: bar\n' +
        ' at http://localhost:5000/foo-pass.js:7:19\n' +
        ' at bar(http://localhost:5000/bar-pass.js:2:3)\n' +
        ' at baz(http://localhost:5000/baz-pass.js:2:9)\n';

      Sentry.captureException(urlWithDeniedUrl);
      Sentry.captureException(urlWithoutDeniedUrl);
    });

    expect(eventData).toHaveLength(1);
    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('pass');
  });
});
