function waitForXHR(xhr, cb) {
  if (xhr.readyState === 4) {
    return cb();
  }

  setTimeout(function() {
    waitForXHR(xhr, cb);
  }, 1000 / 60);
}

async function runInSandbox(page, fn, globals = {}) {
  for (const [globalName, globalVal] of Object.entries(globals)) {
    // Only need to pass a function for the PoC, so, we'll probably need to improve this to support other global types.
    await page.addScriptTag({ content: `var ${globalName} = ${globalVal};` });
  }

  await page.addScriptTag({ content: `(${fn})();` });
}

async function getSentryEvent(page, fn, globals) {
  const request = (
    await Promise.all([runInSandbox(page, fn, globals), page.waitForRequest(/.*.sentry\.io\/api.*/gm)])
  )[1];
  return JSON.parse(request.postData());
}

module.exports = {
  waitForXHR,
  runInSandbox,
  getSentryEvent,
};
