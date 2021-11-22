[0, 1].forEach(() => {
  Sentry.captureException(Error('test'));
});
