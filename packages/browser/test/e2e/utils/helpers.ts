import { Page } from '@playwright/test';
import { Event } from '@sentry/types';

async function runScriptInSandbox(page: Page, path: string): Promise<void> {
  await page.addScriptTag({ path });
}

async function getSentryRequest(page: Page, url: string): Promise<Event> {
  const request = (await Promise.all([page.goto(url), page.waitForRequest(/.*.sentry\.io\/api.*/gm)]))[1];

  return JSON.parse(request.postData() || '');
}

async function getSentryEvents(page: Page, url?: string): Promise<Array<Event>> {
  if (url) {
    await page.goto(url);
  }
  const eventsHandle = await page.evaluateHandle<Array<Event>>('window.events');

  return eventsHandle.jsonValue();
}

async function injectScriptAndGetEvents(page: Page, url: string, scriptPath: string): Promise<Array<Event>> {
  await page.goto(url);
  await runScriptInSandbox(page, scriptPath);

  return await getSentryEvents(page);
}

export { runScriptInSandbox, getSentryRequest, getSentryEvents, injectScriptAndGetEvents };
