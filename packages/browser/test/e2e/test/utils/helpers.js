const Sentry = require('@sentry/browser');

function waitForXHR(xhr, cb) {
  if (xhr.readyState === 4) {
    return cb();
  }

  setTimeout(function() {
    waitForXHR(xhr, cb);
  }, 1000 / 60);
}

async function setGlobals(page, globals = {}) {
  for (const [globalName, globalVal] of Object.entries(globals)) {
    // Only need to pass a function for the PoC, so, we'll probably need to improve this to support other global types.
    await page.addScriptTag({ content: `var ${globalName} = ${globalVal};` });
  }
}

async function runInSandbox(page, fn, globals = {}) {
  await setGlobals(page, globals);
  await page.addScriptTag({ content: `(${fn})();` });
}

async function getSentryRequest(page, fn, globals) {
  const request = (
    await Promise.all([runInSandbox(page, fn, globals), page.waitForRequest(/.*.sentry\.io\/api.*/gm)])
  )[1];

  return JSON.parse(request.postData());
}

async function getSentryEvents(page, fn, globals = {}) {
  await setGlobals(page, globals);

  const eventsHandle = (
    await Promise.all([
      page.evaluateHandle(() => {
        const events = [];

        const scope = Sentry.getCurrentHub().getScope();

        scope.addEventProcessor(function(event) {
          events.push(event);
          return event;
        });
        return events;
      }),
      page.addScriptTag({ content: `(${fn})();` }),
    ])
  )[0];

  return eventsHandle.jsonValue();
}

module.exports = {
  waitForXHR,
  runInSandbox,
  getSentryRequest,
  getSentryEvents,
};
