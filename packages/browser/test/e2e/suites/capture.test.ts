import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { getSentryRequest, injectScriptAndGetEvents } from '../utils/helpers';

// Fixme: Globally thrown errors crashes Chrome and Webkit pages.
test.describe('Capture', () => {
  test.use({
    subjectCategory: 'capture',
  });

  // Fixme: Fails on webkit
  test('captures manually thrown error', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/capture/throw.js');

    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('Sentry Test');
  });

  // Fixme: Fails on webkit
  test('captures undefined function call', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/capture/undefined_fn.js');

    expect(eventData[0].exception.values[0].type).toBe('ReferenceError');
    expect(eventData[0].exception.values[0].value).toBe('undefined_fn is not defined');
  });

  test('captures unhandled promise rejection', async ({ browserName, page, getScenario }) => {
    if (browserName === 'webkit') {
      test.skip();
    }

    const url = await getScenario({});
    const eventData = await injectScriptAndGetEvents(page, url, 'scenarios/subjects/capture/reject.js');

    expect(eventData[0].exception.values[0].type).toBe('UnhandledRejection');
    expect(eventData[0].exception.values[0].value).toBe('Non-Error promise rejection captured with value: Sentry Test');
  });
});
