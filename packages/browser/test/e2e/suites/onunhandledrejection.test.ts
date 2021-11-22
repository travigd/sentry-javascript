import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { getSentryEvents, injectScriptAndGetEvents } from '../utils/helpers';

test.describe('window.onunhandledrejection', () => {
  test.use({
    subjectCategory: 'onunhandledrejection',
  });

  test('should capture unhandledrejection with error', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_error.js',
      );

      expect(eventData[0].exception.values[0].value).toBe('test');
      expect(eventData[0].exception.values[0].type).toBe('Error');

      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  // something, somewhere, (likely a browser extension) effectively casts PromiseRejectionEvents
  // to CustomEvents, moving the `promise` and `reason` attributes of the PRE into
  // the CustomEvent's `detail` attribute, since they're not part of CustomEvent's spec
  // see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent and
  // https://github.com/getsentry/sentry-javascript/issues/2380
  test('should capture PromiseRejectionEvent cast to CustomEvent with type unhandledrejection', async ({
    page,
    getScenario,
  }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({
        subject: 'cast_to_custom',
      });

      const eventData = await getSentryEvents(page, url);

      expect(eventData[0].exception.values[0].value).toBe('test-2');
      expect(eventData[0].exception.values[0].type).toBe('Error');

      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  // there's no evidence that this actually happens, but it could, and our code correctly
  // handles it, so might as well prevent future regression on that score
  test('should capture a random Event with type unhandledrejection', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({
        subject: 'random_event',
      });

      const eventData = await getSentryEvents(page, url);

      expect(eventData[0].exception.values[0].value).toBe(
        'Non-Error promise rejection captured with keys: currentTarget, isTrusted, target, type',
      );
      expect(eventData[0].exception.values[0].type).toBe('Event');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with a string', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_string.js',
      );

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: test');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with a monster string', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_monster_string.js',
      );

      expect(eventData[0].exception.values[0].value).toHaveLength(253);
      expect(eventData[0].exception.values[0].value).toContain('Non-Error promise rejection captured with value: ');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with an object', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_object.js',
      );

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with keys: a, b, c');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with a monster object', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_monster_object.js',
      );

      expect(eventData[0].exception.values[0].value).toBe(
        'Non-Error promise rejection captured with keys: a, b, c, d, e',
      );
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with a number', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_number.js',
      );

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: 1337');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with null', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_null.js',
      );

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: null');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should capture unhandledrejection with an undefined', async ({ page, getScenario }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/with_undefined.js',
      );

      expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: undefined');
      expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
      expect(eventData[0].exception.values[0].mechanism.handled).toBe(false);
      expect(eventData[0].exception.values[0].mechanism.type).toBe('onunhandledrejection');
    }
  });

  test('should skip our own failed requests that somehow bubbled-up to unhandledrejection handler', async ({
    page,
    getScenario,
  }) => {
    const supportsOnunhandledrejection = await page.evaluate(() => typeof PromiseRejectionEvent !== 'undefined');

    if (supportsOnunhandledrejection) {
      const url = await getScenario({});
      const eventData = await injectScriptAndGetEvents(
        page,
        url,
        'scenarios/subjects/onunhandledrejection/skip_failed.js',
      );

      expect(eventData).toHaveLength(2);
    }
  });
});
