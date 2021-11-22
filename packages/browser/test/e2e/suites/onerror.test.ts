import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { injectScriptAndGetEvents } from '../utils/helpers';

test.describe('window.onerror', () => {
  test.use({
    subjectCategory: 'onerror',
  });

  // Fixme: Fails on webkit
  test('should catch syntax errors', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/onerror/syntax.js');

    expect(eventData[0].exception.values[0].type).toMatch(/SyntaxError/);
    // Frame count test is skipped for this one
    // because what we get from an `eval` inside `getSentryEvents`
    // is not just from `eval`'s context.
  });

  // Fixme: Fails on webkit
  test('should catch thrown strings', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/onerror/throw_string.js');

    expect(eventData[0].exception.values[0].value).toMatch(/stringError$/);
  });

  // Fixme: Fails on webkit
  test('should catch thrown objects', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/onerror/throw_object.js');

    expect(eventData[0].exception.values[0].value).toBe('Non-Error exception captured with keys: error, somekey');
    expect(eventData[0].exception.values[0].stacktrace.frames).toHaveLength(1);
    expect(eventData[0].exception.values[0].stacktrace.frames[0]['function']).toMatch(
      /throwObjectError|\?|global code/i,
    );
  });

  // Fixme: Fails on webkit
  test('should catch thrown errors', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/onerror/throw_error.js');

    expect(eventData[0].exception.values[0].type).toMatch(/^Error/);
    expect(eventData[0].exception.values[0].value).toMatch(/realError$/);
  });

  test('should onerror calls with non-string first argument gracefully', async ({ page, getScenario }) => {
    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/onerror/first_argument.js');

    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('Non-Error exception captured with keys: otherKey, type');
    expect(eventData[0].extra.__serialized__).toMatchObject({
      type: 'error',
      otherKey: 'hi',
    });
  });

  test('should NOT catch an exception already caught [but rethrown] via Sentry.captureException', async ({
    page,
    getScenario,
  }) => {
    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/onerror/rethrown.js');

    expect(eventData).toHaveLength(1);
  });
});
