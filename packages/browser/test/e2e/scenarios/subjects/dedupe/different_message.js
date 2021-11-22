[0, 1].forEach(idx => {
  Sentry.captureMessage(`test_${idx}`);
});
