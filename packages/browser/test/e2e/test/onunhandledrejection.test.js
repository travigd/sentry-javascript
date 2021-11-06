const { test, expect } = require('@playwright/test');

const { getSentryEvents } = require('./utils/helpers');

test.describe('window.onunhandledrejection', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test('should capture unhandledrejection with error', async ({ page, browserName }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject(new Error('test'));
      });

      expect(eventData[0].exception.values[0].value).toBe('test');
      expect(eventData[0].exception.values[0].type).toBe('Error');

      if (browserName !== 'webkit') {
        expect(eventData[0].exception.values[0].stacktrace.frames.length).toBeGreaterThan(1);
      }

      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  // something, somewhere, (likely a browser extension) effectively casts PromiseRejectionEvents
  // to CustomEvents, moving the `promise` and `reason` attributes of the PRE into
  // the CustomEvent's `detail` attribute, since they're not part of CustomEvent's spec
  // see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent and
  // https://github.com/getsentry/sentry-javascript/issues/2380
  test('should capture PromiseRejectionEvent cast to CustomEvent with type unhandledrejection', async ({
    page,
    browserName,
  }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        window.dispatchEvent(
          new CustomEvent('unhandledrejection', {
            detail: {
              promise: new Promise(function() {}),
              reason: new Error('test-2'),
            },
          }),
        );
      });

      expect(eventData[0].exception.values[0].value).toBe('test-2');
      expect(eventData[0].exception.values[0].type).toBe('Error');

      if (browserName !== 'webkit') {
        expect(eventData[0].exception.values[0].stacktrace.frames.length).toBeGreaterThan(1);
      }

      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  // there's no evidence that this actually happens, but it could, and our code correctly
  // handles it, so might as well prevent future regression on that score
  test('should capture a random Event with type unhandledrejection', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        window.dispatchEvent(new Event('unhandledrejection'));
      });

      expect(eventData[0].exception.values[0].value).toBe(
        'Non-Error promise rejection captured with keys: currentTarget, isTrusted, target, type',
      );
      expect(eventData[0].exception.values[0].type).toBe('Event');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with a string', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject('test');
      });

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: test');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with a monster string', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject('test'.repeat(100));
      });

      expect(eventData[0].exception.values[0].value).toHaveLength(253);
      expect(eventData[0].exception.values[0].value).toContain('Non-Error promise rejection captured with value: ');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with an object', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject({ a: 'b', b: 'c', c: 'd' });
      });

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with keys: a, b, c');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with a monster object', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        var a = {
          a: '1'.repeat('100'),
          b: '2'.repeat('100'),
          c: '3'.repeat('100'),
        };
        a.d = a.a;
        a.e = a;

        Promise.reject(a);
      });

      expect(eventData[0].exception.values[0].value).toBe(
        'Non-Error promise rejection captured with keys: a, b, c, d, e',
      );
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with a number', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject(1337);
      });

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: 1337');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with null', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject(null);
      });

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: null');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should capture unhandledrejection with an undefined', async ({ page }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject(undefined);
      });

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: undefined');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    } else {
      return true;
    }
  });

  test('should skip our own failed requests that somehow bubbled-up to unhandledrejection handler', async ({
    page,
  }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const eventData = await getSentryEvents(page, () => {
        Promise.reject({
          __sentry_own_request__: true,
        });
        Promise.reject({
          __sentry_own_request__: false,
        });
        Promise.reject({});
      });

      expect(eventData).toHaveLength(2);
    } else {
      return true;
    }
  });
});
