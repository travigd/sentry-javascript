// Note: testing whole `window` object does not work as `window` object is not guaranteed to be serializable.
// Playwright returns `undefined` from `evaluate` if the return value is non-serializable.
window.fooBar = { foo: 'bar' };
requestAnimationFrame(function() {
  window.capturedCtx = this;
  // Capturing a message to trigger `getSentryRequest`.
  Sentry.captureMessage('foo');
});
