import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { getSentryRequest } from '../utils/helpers';

declare global {
  interface Window {
    element: any;
    capturedCall: any;
    capturedCtx: any;
    calls: any[];
  }
}

test.describe('wrapped built-ins', () => {
  test.use({
    subjectCategory: 'builtins',
  });

  test('should capture exceptions from event listeners', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'event_listeners',
    });

    const eventData = await getSentryRequest(page, url);

    const element = await page.evaluate(() => window.element);
    const context = await page.evaluate(() => window.context);
    expect(element).toMatchObject(context);
    expect(eventData.exception.values[0].value).toMatch(/foo/);
  });

  test('should transparently remove event listeners from wrapped functions', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'event_listeners_wrapped_functions',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.exception.values).toHaveLength(1);
  });

  test('should remove the original callback if it was registered before Sentry initialized (w. original method)', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'event_listeners_original_callback',
    });

    await page.goto(url);
    const capturedCall = await page.evaluate('window.capturedCall');
    expect(capturedCall).toBe(false);
  });

  test('should capture exceptions inside setTimeout', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'setTimeout',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.exception.values[0].value).toMatch(/foo/);
  });

  test('should capture exceptions inside setInterval', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'setInterval',
    });

    const eventData = await getSentryRequest(page, url);

    expect(eventData.exception.values[0].value).toMatch(/foo/);
  });

  test.describe('requestAnimationFrame', () => {
    test('should capture exceptions inside callback', async ({ page, getScenario }) => {
      const url = await getScenario({
        subject: 'requestAnimationFrame_callback',
      });

      const requestData = await getSentryRequest(page, url);

      expect(requestData.exception.values[0].value).toMatch(/foo/);
    });

    test('wrapped callback should preserve correct context - window (not-bound)', async ({ page, getScenario }) => {
      const url = await getScenario({
        subject: 'requestAnimationFrame_wrapped_callback_window',
      });

      await getSentryRequest(page, url);
      const capturedCtx = await page.evaluate(() => window.capturedCtx.fooBar);
      const window = await page.evaluate(() => window.fooBar);
      expect(capturedCtx).toMatchObject(window);
    });

    test('wrapped callback should preserve correct context - class bound method', async ({ page, getScenario }) => {
      const url = await getScenario({
        subject: 'requestAnimationFrame_wrapped_callback_class',
      });

      await getSentryRequest(page, url);

      const capturedCtx = await page.evaluate(() => window.capturedCtx);
      expect(capturedCtx.magicNumber).toBe(42);
    });

    test('wrapped callback should preserve correct context - `bind` bound method', async ({ page, getScenario }) => {
      const url = await getScenario({
        subject: 'requestAnimationFrame_wrapped_callback_bind',
      });

      await getSentryRequest(page, url);

      const capturedCtx = await page.evaluate(() => window.capturedCtx);
      expect(capturedCtx.magicNumber).toBe(42);
    });
  });

  test('should capture exceptions from XMLHttpRequest event handlers (e.g. onreadystatechange)', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'xhr_event_handlers',
    });

    const requestData = await getSentryRequest(page, url);

    expect(requestData.exception.values[0].value).toMatch(/foo/);
    expect(requestData.exception.values[0].mechanism).toMatchObject({
      type: 'instrument',
      handled: true,
      data: {
        function: 'onreadystatechange',
      },
    });
  });

  test('should not call XMLHttpRequest onreadystatechange more than once per state', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'xhr_single_call',
    });

    await getSentryRequest(page, url);
    const calls = await page.evaluate(() => window.calls);
    // eslint-disable-next-line guard-for-in
    for (const state in calls) {
      expect(calls[state]).toBe(1);
    }
    expect(Object.keys(calls).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(calls).length).toBeLessThanOrEqual(3);
  });

  test(`should capture built-in's mechanism type as instrument`, async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'builtin_mechanism_type',
    });

    const requestData = await getSentryRequest(page, url);
    const fn = requestData.exception.values[0].mechanism.data.function;
    expect(fn).toBe('setTimeout');
    expect(requestData.exception.values[0].mechanism).toMatchObject({
      type: 'instrument',
      handled: true,
    });
  });

  test(`should capture built-in's handlers fn name in mechanism data`, async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'builtin_mechanism_fn_name',
    });

    const requestData = await getSentryRequest(page, url);
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

  test(`should fallback to <anonymous> fn name in mechanism data if one is unavailable`, async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({
      subject: 'fallback_to_anonymous',
    });

    const requestData = await getSentryRequest(page, url);
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
