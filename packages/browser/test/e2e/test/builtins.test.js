const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { getSentryEvents, getSentryRequest } = require('./utils/helpers');

test.describe('wrapped built-ins', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test('should capture exceptions from event listeners', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      div.addEventListener(
        'click',
        function() {
          window.element = div;
          window.context = this;
          // eslint-disable-next-line no-undef
          foo();
        },
        false,
      );

      const click = new MouseEvent('click');
      div.dispatchEvent(click);
    });

    const element = await page.evaluate(() => window.element);
    const context = await page.evaluate(() => window.context);
    expect(element).toMatchObject(context);
    expect(eventData[0].exception.values[0].value).toMatch(/foo/);
  });

  test('should transparently remove event listeners from wrapped functions', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const fooFn = function() {
        // eslint-disable-next-line no-undef
        foo();
      };
      const barFn = function() {
        // eslint-disable-next-line no-undef
        bar();
      };
      div.addEventListener('click', fooFn);
      div.addEventListener('click', barFn);
      div.removeEventListener('click', barFn);
      div.dispatchEvent(new MouseEvent('click'));
    });

    expect(eventData).toHaveLength(1);
  });

  test('should remove the original callback if it was registered before Sentry initialized (w. original method)', async ({
    page,
  }) => {
    await getSentryEvents(page, () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      window.capturedCall = false;
      const captureFn = function() {
        window.capturedCall = true;
      };
      // Use original addEventListener to simulate non-wrapped behavior (callback is attached without __sentry_wrapped__)
      window.originalBuiltIns.addEventListener.call(div, 'click', captureFn);
      // Then attach the same callback again, but with already wrapped method
      div.addEventListener('click', captureFn);
      div.removeEventListener('click', captureFn);
      div.dispatchEvent(new MouseEvent('click'));
    });

    const capturedCall = await page.evaluate(() => window.capturedCall);

    expect(capturedCall).toBe(false);
  });

  test('should capture exceptions inside setTimeout', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      setTimeout(function() {
        // eslint-disable-next-line no-undef
        foo();
      });
    });

    expect(eventData[0].exception.values[0].value).toMatch(/foo/);
  });

  test('should capture exceptions inside setInterval', async ({ page }) => {
    const eventData = await getSentryEvents(page, () => {
      const exceptionInterval = setInterval(function() {
        clearInterval(exceptionInterval);
        // eslint-disable-next-line no-undef
        foo();
      }, 0);
    });

    expect(eventData[0].exception.values[0].value).toMatch(/foo/);
  });

  test.describe('requestAnimationFrame', () => {
    test('should capture exceptions inside callback', async ({ page }) => {
      // wait for page to be visible or requestAnimationFrame won't ever fire
      await page.waitForSelector('body');

      // Note: Using `getSentryRequest` here as it waits for the callback inside `requestAnimationFrame` by default.
      const requestData = await getSentryRequest(page, () => {
        requestAnimationFrame(function() {
          // eslint-disable-next-line no-undef
          foo();
        });
      });

      expect(requestData.exception.values[0].value).toMatch(/foo/);
    });

    test('wrapped callback should preserve correct context - window (not-bound)', async ({ page }) => {
      // wait for page to be visible or requestAnimationFrame won't ever fire
      await page.waitForSelector('body');

      // Note: Using `getSentryRequest` here as it waits for the callback inside `requestAnimationFrame` by default.
      await getSentryRequest(page, () => {
        // Note: testing whole `window` object does not work as `window` object is not guaranteed to be serializable.
        // Playwright returns `undefined` from `evaluate` if the return value is non-serializable.
        window.fooBar = { foo: 'bar' };
        requestAnimationFrame(function() {
          window.capturedCtx = this;

          // Capturing a message to trigger `getSentryRequest`.
          Sentry.captureMessage('foo');
        });
      });

      const capturedCtx = await page.evaluate(() => window.capturedCtx.fooBar);
      const window = await page.evaluate(() => window.fooBar);

      expect(capturedCtx).toMatchObject(window);
    });

    test('wrapped callback should preserve correct context - class bound method', async ({ page }) => {
      // wait for page to be visible or requestAnimationFrame won't ever fire
      await page.waitForSelector('body');

      // Note: Using `getSentryRequest` here as it waits for the callback inside `requestAnimationFrame` by default.
      await getSentryRequest(page, () => {
        // TypeScript-transpiled class syntax
        const Foo = (function() {
          function Foo() {
            const _this = this;
            this.magicNumber = 42;
            this.getThis = function() {
              window.capturedCtx = _this;
              // Capturing a message to trigger `getSentryRequest`.
              Sentry.captureMessage('foo');
            };
          }
          return Foo;
        })();
        const foo = new Foo();
        requestAnimationFrame(foo.getThis);
      });

      const capturedCtx = await page.evaluate(() => window.capturedCtx);

      expect(capturedCtx.magicNumber).toBe(42);
    });

    test('wrapped callback should preserve correct context - `bind` bound method', async ({ page }) => {
      // wait for page to be visible or requestAnimationFrame won't ever fire
      await page.waitForSelector('body');

      // Note: Using `getSentryRequest` here as it waits for the callback inside `requestAnimationFrame` by default.
      await getSentryRequest(page, () => {
        function foo() {
          window.capturedCtx = this;
          // Capturing a message to trigger `getSentryRequest`.
          Sentry.captureMessage('foo');
        }
        requestAnimationFrame(foo.bind({ magicNumber: 42 }));
      });

      const capturedCtx = await page.evaluate(() => window.capturedCtx);

      expect(capturedCtx.magicNumber).toBe(42);
    });
  });

  test('should capture exceptions from XMLHttpRequest event handlers (e.g. onreadystatechange)', async ({ page }) => {
    // Note: Using `getSentryRequest` here as it waits for the callback inside `requestAnimationFrame` by default.
    const requestData = await getSentryRequest(page, () => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/base/subjects/example.json');
      // intentionally assign event handlers *after* open, since this is what jQuery does
      xhr.onreadystatechange = function wat() {
        // replace onreadystatechange with no-op so exception doesn't
        // fire more than once as XHR changes loading state
        xhr.onreadystatechange = function() {};
        // eslint-disable-next-line no-undef
        foo();
        // Capturing a message to trigger `getSentryRequest`.
        Sentry.captureMessage('foo');
      };
      xhr.send();
    });

    expect(requestData.exception.values[0].value).toMatch(/foo/);
    expect(requestData.exception.values[0].mechanism).toMatchObject({
      type: 'instrument',
      handled: true,
      data: {
        function: 'onreadystatechange',
      },
    });
  });

  test('should not call XMLHttpRequest onreadystatechange more than once per state', async ({ page }) => {
    // Note: Using `getSentryRequest` here as it waits for the callback inside `requestAnimationFrame` by default.
    await getSentryRequest(page, () => {
      window.calls = {};
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/base/subjects/example.json');
      xhr.onreadystatechange = function wat() {
        window.calls[xhr.readyState] = window.calls[xhr.readyState] ? window.calls[xhr.readyState] + 1 : 1;
        if (xhr.readyState === 4) {
          // Capturing a message to trigger `getSentryRequest`.
          Sentry.captureMessage('foo');
        }
      };
      xhr.send();
    });

    const calls = await page.evaluate(() => window.calls);

    // eslint-disable-next-line guard-for-in
    for (const state in calls) {
      expect(calls[state]).toBe(1);
    }

    expect(Object.keys(calls).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(calls).length).toBeLessThanOrEqual(4);
  });

  test(`should capture built-in's mechanism type as instrument`, async ({ page }) => {
    const requestData = await getSentryRequest(page, () => {
      setTimeout(function() {
        // eslint-disable-next-line no-undef
        foo();
      });
    });

    const fn = requestData.exception.values[0].mechanism.data.function;

    expect(fn).toBe('setTimeout');

    expect(requestData.exception.values[0].mechanism).toMatchObject({
      type: 'instrument',
      handled: true,
    });
  });

  test(`should capture built-in's handlers fn name in mechanism data`, async ({ page }) => {
    const requestData = await getSentryRequest(page, () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      div.addEventListener(
        'click',
        function namedFunction() {
          // eslint-disable-next-line no-undef
          foo();
        },
        false,
      );
      const click = new MouseEvent('click');
      div.dispatchEvent(click);
    });

    const fn = requestData.exception.values[0].mechanism.data.function;
    expect(fn).toBe('addEventListener');

    const handler = requestData.exception.values[0].mechanism.data.handler;
    expect(handler).toBe('namedFunction');

    expect(requestData.exception.values[0].mechanism).toMatchObject({
      type: 'instrument',
      handled: true,
      data: {
        function: 'addEventListener',
      },
    });
  });

  test(`should fallback to <anonymous> fn name in mechanism data if one is unavailable`, async ({ page }) => {
    const requestData = await getSentryRequest(page, () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      div.addEventListener(
        'click',
        function() {
          // eslint-disable-next-line no-undef
          foo();
        },
        false,
      );
      const click = new MouseEvent('click');
      div.dispatchEvent(click);
    });

    const target = requestData.exception.values[0].mechanism.data.target;
    expect(target).toBe('EventTarget');

    expect(requestData.exception.values[0].mechanism).toMatchObject({
      type: 'instrument',
      handled: true,
      data: {
        function: 'addEventListener',
        handler: '<anonymous>',
      },
    });
  });
});
