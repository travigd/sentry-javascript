const testError = Error('test');

[0, 1].forEach(() => {
  Sentry.captureException(testError);
});
