import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { getSentryEvents, getSentryRequest, injectScriptAndGetEvents } from '../utils/helpers';

declare global {
  interface Window {
    handlerCalled: boolean;
  }
}

test.describe('Breadcrumbs', () => {
  test.use({
    subjectCategory: 'breadcrumbs',
  });
  test('should record an XMLHttpRequest with a handler', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'xhr_with_handler',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
  });

  test('should record an XMLHttpRequest with a handler attached after send was called', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'xhr_with_handler_after_send',
    });

    const eventData = await getSentryRequest(page, url);

    const handlerCalled = await (await page.evaluateHandle(() => Promise.resolve(window.handlerCalled))).jsonValue();

    expect(handlerCalled).toBe(true);
    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
  });

  test('should record an XMLHttpRequest without any handlers set', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'xhr_without_handler',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
    expect(eventData.breadcrumbs[0].data.input).toBeUndefined();
  });

  test('should give access to request body for XMLHttpRequest POST requests', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'xhr_request_body',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('xhr');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('POST');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
    expect(eventData.breadcrumbs[0].data.input).toBeUndefined();
    expect(eventData.breadcrumbs[0].hint.input).toBe('{"foo":"bar"}');
  });

  test('should record a fetch request', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'fetch_basic',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('fetch');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
  });

  test('should record a fetch request with Request obj instead of URL string', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'fetch_request_object',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('fetch');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toContain('/base/subjects/example.json');
  });

  test('should record a fetch request with an arbitrary type argument', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'fetch_arbitrary_type_argument',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('fetch');
    expect(eventData.breadcrumbs[0].type).toBe('http');
    expect(eventData.breadcrumbs[0].data.method).toBe('GET');
    expect(eventData.breadcrumbs[0].data.url).toContain('123');
  });

  test('should provide a hint for dom events that includes event name and event itself', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'dom_event_name',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].hint.name).toBe('click');
    expect(eventData.breadcrumbs[0].hint.event.target).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should not fail with click or keypress handler with no callback', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'dom_handler_no_callback',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.breadcrumbs.length).toBe(2);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.breadcrumbs[1].category).toBe('ui.input');
    expect(eventData.breadcrumbs[1].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.exception).toBeUndefined();
  });

  test('should not fail with custom event', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'custom_event_basic',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.breadcrumbs).toBeUndefined();
    expect(eventData.exception).toBeUndefined();
  });

  test('should not fail with custom event and handler with no callback', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'custom_event_handler_no_callback',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.breadcrumbs).toBeUndefined();
    expect(eventData.exception).toBeUndefined();
  });

  test('records record a mouse click on element WITH click handler present', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'click_event_with_handler',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.exception).toBeUndefined();
  });

  // TODO: Should be checked to see if this implementation is still valid. Fails at the moment.
  test('should record a mouse click on element WITHOUT click handler present', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'click_event_without_handler',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
    expect(eventData.exception).toBeUndefined();
  });

  test('should only record a SINGLE mouse click for a tree of elements with event listeners', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'click_event_tree_listeners',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > div.c > div.b > div.a');
  });

  test('should bail out if accessing the `target` property of an event throws an exception', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'click_target_throws',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('<unknown>');
  });

  test('should record consecutive keypress events into a single "input" breadcrumb', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'input_consecutive_keypresses',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.input');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should correctly capture multiple consecutive breadcrumbs if they are of different type', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'multiple_breadcrumbs_different_types',
    });

    const eventData = await getSentryRequest(page, url);

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
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'multiple_breadcrumbs_switching_type',
    });

    const eventData = await getSentryRequest(page, url);

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
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'multiple_breadcrumbs_switching_target',
    });

    const eventData = await getSentryRequest(page, url);

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

  // Fixme: This fails on webkit
  test('should flush keypress breadcrumbs when an error is thrown', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(
      page,
      url,
      'scenarios/subjects/breadcrumbs/flush_keypress_error.js',
    );

    expect(eventData[0].breadcrumbs.length).toBe(1);
    expect(eventData[0].breadcrumbs[0].category).toBe('ui.input');
    expect(eventData[0].breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should flush keypress breadcrumb when input event occurs immediately after', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'flush_keypress_input_event',
    });

    const eventData = await getSentryRequest(page, url);

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
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'contenteditable_consecutive_keypress',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.input');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > div.contenteditable');
  });

  test('should record click events that were handled using an object with handleEvent property and call original callback', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'click_handleEvent',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.message).toBe('test');
    expect(eventData.breadcrumbs.length).toBe(1);
    expect(eventData.breadcrumbs[0].category).toBe('ui.click');
    expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
  });

  test('should remove breadcrumb instrumentation when all event listeners are detached', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'remove_breadcrumb_on_detach',
    });

    const eventData = await getSentryEvents(page, url);

    expect(eventData[0].message).toBe('test');
    expect(eventData[0].breadcrumbs).toBeUndefined();
    expect(eventData[0].exception).toBeUndefined();
  });

  // Fixme: This should be tested on a web server.
  test.skip('should record history.[pushState|replaceState] changes as navigation breadcrumbs', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({});
    const eventData = injectScriptAndGetEvents(
      page,
      url,
      'scenarios/subjects/breadcrumbs/record_history_push_replace_state.js',
    )[0];

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
