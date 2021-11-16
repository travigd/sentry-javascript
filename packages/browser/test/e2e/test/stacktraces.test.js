const { test, expect } = require('@playwright/test');

const { getSentryEvents } = require('./utils/helpers');

test.describe('stacktraces', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test.describe('filenames', () => {
    test(`should be able to parse localhost filenames on different browsers`, async ({ page, browserName }) => {
      const eventData = await getSentryEvents(page, () => {
        throw new Error();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;

      if (browserName === 'chromium') {
        expect(frames[frames.length - 1].filename).toBe('<anonymous>');
      } else if (browserName === 'webkit') {
        expect(frames[frames.length - 1].filename).toBe('http://localhost:8080/');
      } else if (browserName === 'firefox') {
        expect(frames[frames.length - 1].filename).toContain('http://localhost:8080/ line');
      }
    });

    // TODO: Add cases / scenarios for non-local urls.
    // TODO: Add cases / scenarios for webpack-dev-server file paths
  });

  test.describe('function identfiers', () => {
    test(`should set '?' as the function identifier from an unknown scope`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        throw new Error();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;

      expect(frames[frames.length - 1].function).toBe('?');
    });

    test(`should set the name of a 'function declaration' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        function foo() {
          throw new Error();
        }

        foo();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
    });

    test(`should set the name of a 'function expression' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        const foo = function() {
          throw new Error();
        };

        foo();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
    });

    test(`should set the name of an 'arrow function expression' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        const foo = () => {
          throw new Error();
        };

        foo();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
    });

    test(`should set names of nested 'function expressions' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        const foo = function() {
          throw new Error();
        };

        const bar = function() {
          foo();
        };

        bar();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
      expect(frames[frames.length - 2].function).toBe('bar');
    });

    test(`should set names of nested 'arrow function expressions' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        const foo = () => {
          throw new Error();
        };

        const bar = () => foo();

        bar();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
      expect(frames[frames.length - 2].function).toBe('bar');
    });
    test(`should set names of 'arrow function expression inside function expression' in stack frames`, async ({
      page,
    }) => {
      const eventData = await getSentryEvents(page, () => {
        const foo = () => {
          throw new Error();
        };

        const bar = function() {
          foo();
        };

        bar();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
      expect(frames[frames.length - 2].function).toBe('bar');
    });

    test(`should set names of 'function expression inside arrow function expression' in stack frames`, async ({
      page,
    }) => {
      const eventData = await getSentryEvents(page, () => {
        const foo = function() {
          throw new Error();
        };

        const bar = () => {
          foo();
        };

        bar();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('foo');
      expect(frames[frames.length - 2].function).toBe('bar');
    });

    // Fails on firefox and webkit
    // Skipped for now (Related: #4153)
    test.skip(`should support function names containing 'file' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        function fileFoo() {
          throw new Error();
        }

        const barFile = function() {
          fileFoo();
        };

        barFile();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('fileFoo');
      expect(frames[frames.length - 2].function).toBe('barFile');
    });

    // Fails on firefox and webkit
    // Skipped for now (Related: #4153)
    test.skip(`should support function names containing 'http' in stack frames`, async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        function httpReq() {
          throw new Error();
        }

        const RequestHTTP = function() {
          httpReq();
        };

        RequestHTTP();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;
      expect(frames[frames.length - 1].function).toBe('httpReq');
      expect(frames[frames.length - 2].function).toBe('RequestHTTP');
    });
  });

  test.describe('column numbers', () => {
    test('should be able to parse a number as the column from the stacktrace.', async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        throw new Error();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;

      frames.forEach(frame => {
        // [native code] frames in webkit doesn't have a `colno` or `lineno`
        if (frame.filename !== '[native code]') {
          expect(frame.colno).toEqual(expect.any(Number));
        }
      });
    });
  });

  test.describe('line numbers', () => {
    test('should be able to parse a number as the column from the stacktrace.', async ({ page }) => {
      const eventData = await getSentryEvents(page, () => {
        throw new Error();
      });

      const frames = eventData[0].exception.values[0].stacktrace.frames;

      frames.forEach(frame => {
        // [native code] frames in webkit doesn't have a `colno` or `lineno`
        if (frame.filename !== '[native code]') {
          expect(frame.lineno).toEqual(expect.any(Number));
        }
      });
    });
  });
});
