function foo() {
  window.capturedCtx = this;
  // Capturing a message to trigger `getSentryRequest`.
  Sentry.captureMessage('foo');
}
requestAnimationFrame(foo.bind({ magicNumber: 42 }));
