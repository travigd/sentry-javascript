import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { getSentryEvents } from '../utils/helpers';

test.describe('config', () => {
  test.use({
    subjectCategory: 'config',
  });

  test('should allow to ignore specific errors', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'ignore_error',
    });

    const eventData = await getSentryEvents(page, url);

    expect(eventData).toHaveLength(2);
    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('foo');
    expect(eventData[1].exception.values[0].type).toBe('Error');
    expect(eventData[1].exception.values[0].value).toBe('bar');
  });

  test('should allow to ignore specific urls', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'ignore_url',
    });

    const eventData = await getSentryEvents(page, url);
    expect(eventData).toHaveLength(1);
    expect(eventData[0].exception.values[0].type).toBe('Error');
    expect(eventData[0].exception.values[0].value).toBe('pass');
  });
});
