const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { waitForXHR, getSentryRequest } = require('./utils/helpers');

test.describe('Breadcrumbs', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(baseURL);
  });

  test('should record an XMLHttpRequest with a handler', async ({ page }) => {
    const eventData = await getSentryRequest(
      page,
      () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/base/subjects/example.json');
        xhr.onreadystatechange = function() {};
        xhr.send();

        waitForXHR(xhr, function() {
          Sentry.captureMessage('test');
        });
      },
      { waitForXHR },
    );

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
  });

  test('should record an XMLHttpRequest with a handler attached after send was called', async ({ page }) => {
    const eventData = await getSentryRequest(
      page,
      () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/base/subjects/example.json');
        xhr.onreadystatechange = function() {
          window.handlerCalled = true;
        };
        xhr.send();

        waitForXHR(xhr, function() {
          Sentry.captureMessage('test');
        });
      },
      { waitForXHR },
    );

    const handlerCalled = await (await page.evaluateHandle(() => Promise.resolve(window.handlerCalled))).jsonValue();

    expect(handlerCalled).toBe(true);
    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
  });

  test('should record an XMLHttpRequest without any handlers set', async ({ page }) => {
    const eventData = await getSentryRequest(
      page,
      () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/base/subjects/example.json');
        xhr.send();

        waitForXHR(xhr, function() {
          Sentry.captureMessage('test');
        });
      },
      { waitForXHR },
    );

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
    expect(eventData.breadcrumbs[0].data.input).toBeUndefined();
  });

  test('should give access to request body for XMLHttpRequest POST requests', async ({ page }) => {
    const eventData = await getSentryRequest(
      page,
      () => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/base/subjects/example.json');
        xhr.send('{"foo":"bar"}');

        waitForXHR(xhr, function() {
          Sentry.captureMessage('test');
        });
      },
      { waitForXHR },
    );

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('POST');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
    expect(eventData.breadcrumbs[0].data.input).toBeUndefined();
    expect(eventData.breadcrumbs[0].hint.input).toBe('{"foo":"bar"}');
  });

  test('should record a fetch request', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      fetch('/base/subjects/example.json', {
        method: 'GET',
      }).then(
        function() {
          Sentry.captureMessage('test');
        },
        function() {
          Sentry.captureMessage('test');
        },
      );
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('fetch');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
  });

  test('should record a fetch request with Request obj instead of URL string', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      fetch(new Request('/base/subjects/example.json')).then(
        function() {
          Sentry.captureMessage('test');
        },
        function() {
          Sentry.captureMessage('test');
        },
      );
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('fetch');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toContain('/base/subjects/example.json');
  });

  test('should record a fetch request with an arbitrary type argument', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      fetch(123).then(
        function() {
          Sentry.captureMessage('test');
        },
        function() {
          Sentry.captureMessage('test');
        },
      );
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('fetch');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toContain('123');
  });

  test('should provide a hint for dom events that includes event name and event itself', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];
      const clickHandler = function() {};
      input.addEventListener('click', clickHandler);
      const click = new MouseEvent('click');
      input.dispatchEvent(click);
      Sentry.captureMessage('test');
    });

    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].hint.name).toBe('click');
    expect(eventData.breadcrumbs[0].hint.event.target).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should not fail with click or keypress handler with no callback', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];
      input.addEventListener('click', undefined);
      input.addEventListener('keypress', undefined);

      const click = new MouseEvent('click');
      input.dispatchEvent(click);

      const keypress = new KeyboardEvent('keypress');
      input.dispatchEvent(keypress);

      Sentry.captureMessage('test');
    });

    expect(eventData.breadcrumbs.length).toBe(2);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[1].category).toBe('ui.input');
    expect(eventData.breadcrumbs[1].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.exception).toBeUndefined();
  });

  test('should not fail with custom event', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];
      input.addEventListener('build', function(evt) {
        evt.stopPropagation();
      });

      const customEvent = new CustomEvent('build', { detail: 1 });
      input.dispatchEvent(customEvent);

      Sentry.captureMessage('test');
    });

    expect(eventData.breadcrumbs).toBeUndefined();
    expect(eventData.exception).toBeUndefined();
  });

  test('should not fail with custom event and handler with no callback', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];
      input.addEventListener('build', undefined);

      const customEvent = new CustomEvent('build', { detail: 1 });
      input.dispatchEvent(customEvent);

      Sentry.captureMessage('test');
    });

    expect(eventData.breadcrumbs).toBeUndefined();
    expect(eventData.exception).toBeUndefined();
  });

  test('records record a mouse click on element WITH click handler present', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      // add an event listener to the input. we want to make sure that
      // our breadcrumbs still work even if the page has an event listener
      // on an element that cancels event bubbling
      const input = document.getElementsByTagName('input')[0];
      const clickHandler = function(evt) {
        evt.stopPropagation(); // don't bubble
      };
      input.addEventListener('click', clickHandler);

      // click <input/>
      const click = new MouseEvent('click');
      input.dispatchEvent(click);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.exception).toBeUndefined();
  });

  // TODO: Should be checked to see if this implementation is still valid. Fails at the moment.
  test('should record a mouse click on element WITHOUT click handler present', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      // click <input/>
      const click = new MouseEvent('click');

      const input = document.getElementsByTagName('input')[0];

      // TODO: This next line wasn't required for the old tests.
      input.addEventListener('click');
      input.dispatchEvent(click);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.exception).toBeUndefined();
  });

  test('should only record a SINGLE mouse click for a tree of elements with event listeners', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const clickHandler = function() {};

      // mousemove event shouldnt clobber subsequent "breadcrumbed" events (see #724)
      document.querySelector('.a').addEventListener('mousemove', clickHandler);

      document.querySelector('.a').addEventListener('click', clickHandler);
      document.querySelector('.b').addEventListener('click', clickHandler);
      document.querySelector('.c').addEventListener('click', clickHandler);

      // click <input/>
      const click = new MouseEvent('click');
      const input = document.querySelector('.a'); // leaf node
      input.dispatchEvent(click);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > div.c > div.b > div.a');
  });

  test('should bail out if accessing the `target` property of an event throws an exception', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      // click <input/>
      const click = new MouseEvent('click');
      function kaboom() {
        throw new Error('lol');
      }
      Object.defineProperty(click, 'target', { get: kaboom });

      const input = document.querySelector('.a'); // leaf node
      input.addEventListener('click');
      input.dispatchEvent(click);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('<unknown>');
  });

  test('should record consecutive keypress events into a single "input" breadcrumb', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      // keypress <input/> twice
      const keypress1 = new KeyboardEvent('keypress');
      const keypress2 = new KeyboardEvent('keypress');

      const input = document.getElementsByTagName('input')[0];
      input.addEventListener('keypress');

      input.dispatchEvent(keypress1);
      input.dispatchEvent(keypress2);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.input');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should correctly capture multiple consecutive breadcrumbs if they are of different type', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];

      const clickHandler = function() {};
      input.addEventListener('click', clickHandler);
      const keypressHandler = function() {};
      input.addEventListener('keypress', keypressHandler);

      input.dispatchEvent(new MouseEvent('click'));
      input.dispatchEvent(new KeyboardEvent('keypress'));

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(2);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[1].category).toBe('ui.input');
    expect(eventData.breadcrumbs[1].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[0].hint.global).toBe(false);
    expect(eventData.breadcrumbs[1].hint.global).toBe(false);
    expect(eventData.exception).toBeUndefined();
  });

  test('should debounce multiple consecutive identical breadcrumbs but allow for switching to a different type', async ({
    page,
  }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];

      const clickHandler = function() {};
      input.addEventListener('click', clickHandler);
      const keypressHandler = function() {};
      input.addEventListener('keypress', keypressHandler);

      input.dispatchEvent(new MouseEvent('click'));
      input.dispatchEvent(new MouseEvent('click'));
      input.dispatchEvent(new MouseEvent('click'));
      input.dispatchEvent(new KeyboardEvent('keypress'));
      input.dispatchEvent(new KeyboardEvent('keypress'));
      input.dispatchEvent(new KeyboardEvent('keypress'));

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(2);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[1].category).toBe('ui.input');
    expect(eventData.breadcrumbs[1].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[0].hint.global).toBe(false);
    expect(eventData.breadcrumbs[1].hint.global).toBe(false);
    expect(eventData.exception).toBeUndefined();
  });

  test('should debounce multiple consecutive identical breadcrumbs but allow for switching to a different target', async ({
    page,
  }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.querySelector('#foo-form input');
      const div = document.querySelector('#foo-form div');

      const clickHandler = function() {};
      input.addEventListener('click', clickHandler);
      div.addEventListener('click', clickHandler);

      input.dispatchEvent(new MouseEvent('click'));
      div.dispatchEvent(new MouseEvent('click'));

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(2);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[1].category).toBe('ui.click');
    expect(eventData.breadcrumbs[1].message).toBe('body > form#foo-form > div.contenteditable');
    expect(eventData.breadcrumbs[0].hint.global).toBe(false);
    expect(eventData.breadcrumbs[1].hint.global).toBe(false);
    expect(eventData.exception).toBeUndefined();
  });

  test('should flush keypress breadcrumbs when an error is thrown', async ({ page }) => {
    const eventData = await getSentryRequest(
      page,
      () => {
        // keypress <input/>
        const keypress = new KeyboardEvent('keypress');
        const input = document.getElementsByTagName('input')[0];
        input.addEventListener('keypress');

        input.dispatchEvent(keypress);

        // eslint-disable-next-line no-undef
        foo(); // throw exception
      },
      { foo: undefined },
    );

    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.input');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should flush keypress breadcrumb when input event occurs immediately after', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      // 1st keypress <input/>
      const keypress1 = new KeyboardEvent('keypress');
      // click <input/>
      const click = new MouseEvent('click');
      // 2nd keypress
      const keypress2 = new KeyboardEvent('keypress');

      const input = document.getElementsByTagName('input')[0];
      input.addEventListener('keypress');
      input.addEventListener('click');

      input.dispatchEvent(keypress1);
      input.dispatchEvent(click);
      input.dispatchEvent(keypress2);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(3);
    expect(eventData.breadcrumbs[0].category).toBe('ui.input');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[1].category).toBe('ui.click');
    expect(eventData.breadcrumbs[1].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[2].category).toBe('ui.input');
    expect(eventData.breadcrumbs[2].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should record consecutive keypress events in a contenteditable into a single "input" breadcrumb', async ({
    page,
  }) => {
    const eventData = await getSentryRequest(page, () => {
      // keypress <input/> twice
      const keypress1 = new KeyboardEvent('keypress');
      const keypress2 = new KeyboardEvent('keypress');

      const div = document.querySelector('[contenteditable]');
      div.addEventListener('keypress');

      div.dispatchEvent(keypress1);
      div.dispatchEvent(keypress2);

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.input');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > div.contenteditable');
  });

  test('should record click events that were handled using an object with handleEvent property and call original callback', async ({
    page,
  }) => {
    const eventData = await getSentryRequest(page, () => {
      window.handleEventCalled = false;

      const input = document.getElementsByTagName('input')[0];
      input.addEventListener('click', {
        handleEvent: function() {
          window.handleEventCalled = true;
        },
      });
      input.dispatchEvent(new MouseEvent('click'));

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  // TODO: Check why this is failing.
  test.skip('should remove breadcrumb instrumentation when all event listeners are detached', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      const input = document.getElementsByTagName('input')[0];

      const clickHandler = function() {};
      const otherClickHandler = function() {};
      input.addEventListener('click', clickHandler);
      input.addEventListener('click', otherClickHandler);
      input.removeEventListener('click', clickHandler);
      input.removeEventListener('click', otherClickHandler);

      const keypressHandler = function() {};
      const otherKeypressHandler = function() {};
      input.addEventListener('keypress', keypressHandler);
      input.addEventListener('keypress', otherKeypressHandler);
      input.removeEventListener('keypress', keypressHandler);
      input.removeEventListener('keypress', otherKeypressHandler);

      input.dispatchEvent(new MouseEvent('click'));
      input.dispatchEvent(new KeyboardEvent('keypress'));

      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(2);
    expect(eventData.breadcrumbs[0].hint.global).toBe(true);
    expect(eventData.breadcrumbs[1].hint.global).toBe(true);
    expect(eventData.exception).toBeUndefined();
  });

  test('should record history.[pushState|replaceState] changes as navigation breadcrumbs', async ({ page }) => {
    const eventData = await getSentryRequest(page, () => {
      history.pushState({}, '', '/foo');
      history.pushState({}, '', '/bar?a=1#fragment');
      history.pushState({}, '', {}); // pushState calls toString on non-string args
      history.pushState({}, '', null); // does nothing / no-op
      // can't call history.back() because it will change url of parent document
      // (e.g. document running mocha) ... instead just "emulate" a back button
      // press by calling replaceState
      history.replaceState({}, '', '/bar?a=1#fragment');
      Sentry.captureMessage('test');
    });

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(4);
    expect(eventData.breadcrumbs[0].category).toBe('navigation');
    expect(eventData.breadcrumbs[1].category).toBe('navigation');
    expect(eventData.breadcrumbs[2].category).toBe('navigation');
    expect(eventData.breadcrumbs[3].category).toBe('navigation');

    expect(/\/foo$/.test(eventData.breadcrumbs[0].data.to)).toBeTruthy();
    expect(/\/foo$/.test(eventData.breadcrumbs[1].data.from)).toBeTruthy();
    expect(/\/bar\?a=1#fragment$/.test(eventData.breadcrumbs[1].data.to)).toBeTruthy();
    expect(/\/bar\?a=1#fragment$/.test(eventData.breadcrumbs[2].data.from)).toBeTruthy();
    expect(/\[object Object\]$/.test(eventData.breadcrumbs[2].data.to)).toBeTruthy();
    expect(/\[object Object\]$/.test(eventData.breadcrumbs[3].data.from)).toBeTruthy();
    expect(/\/bar\?a=1#fragment/.test(eventData.breadcrumbs[3].data.to)).toBeTruthy();
  });
});
