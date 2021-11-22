import { expect } from '@playwright/test';

import test from '../utils/fixtures';
import { getSentryEvents } from '../utils/helpers';

test.describe('Dedupe Integration', () => {
  test.use({
    subjectCategory: 'dedupe',
  });

  test(`doesn't drop message event if it has a different message from previous`, async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'different_message',
    });

    const eventData = await getSentryEvents(page, url);

    expect(eventData).toHaveLength(2);
  });

  test('drops duplicate event if it has the same message as previous', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'same_message',
    });

    const eventData = await getSentryEvents(page, url);

    expect(eventData).toHaveLength(1);
  });

  test(`drops separately thrown exceptions of the same type and message`, async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'same_type_message_separate',
    });

    const eventData = await getSentryEvents(page, url);

    expect(eventData).toHaveLength(1);
  });

  test('drops duplicate exception if it has the same fingerprint as previous', async ({ page, getScenario }) => {
    const url = await getScenario({
      subject: 'same_fingerprint',
    });

    const eventData = await getSentryEvents(page, url);

    expect(eventData).toHaveLength(1);
  });
});
