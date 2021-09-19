const { test, expect } = require('@playwright/test');
const Sentry = require('@sentry/browser');

const { waitForXHR, getSentryEvent } = require('./utils/helpers');

test.beforeEach(async ({ baseURL, page }) => {
  await page.goto(baseURL);
});

test('records breadcrumbs for a simple XHR `GET` request', async ({ page }) => {
  const eventData = await getSentryEvent(
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

  expect(eventData.breadcrumbs.length).toBe(1);
  expect(eventData.breadcrumbs[0].category).toBe('xhr');
  expect(eventData.breadcrumbs[0].type).toBe('http');
  expect(eventData.breadcrumbs[0].data.method).toBe('GET');
  expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
});

test('records breadcrumbs for a fetch request', async ({ page }) => {
  const eventData = await getSentryEvent(page, () => {
    fetch('/base/subjects/example.json', {
      method: 'GET',
    }).then(function() {
      Sentry.captureMessage('test');
    });
  });

  expect(eventData.breadcrumbs.length).toBe(1);
  expect(eventData.breadcrumbs[0].category).toBe('fetch');
  expect(eventData.breadcrumbs[0].type).toBe('http');
  expect(eventData.breadcrumbs[0].data.method).toBe('GET');
  expect(eventData.breadcrumbs[0].data.url).toBe('/base/subjects/example.json');
});

test('records record a mouse click on element WITH click handler present', async ({ page }) => {
  const eventData = await getSentryEvent(page, () => {
    // add an event listener to the input. we want to make sure that
    // our breadcrumbs still work even if the page has an event listener
    // on an element that cancels event bubbling

    var input = document.getElementsByTagName('input')[0];
    var clickHandler = function(evt) {
      evt.stopPropagation(); // don't bubble
    };
    input.addEventListener('click', clickHandler);

    // click <input/>
    var click = new MouseEvent('click');
    input.dispatchEvent(click);

    Sentry.captureMessage('test');
  });

  expect(eventData.breadcrumbs.length).toBe(1);
  expect(eventData.breadcrumbs[0].category).toBe('ui.click');
  expect(eventData.breadcrumbs[0].message).toBe('body > form#foo-form > input[name="foo"]');
});
