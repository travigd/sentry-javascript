fetch(123).then(
  function() {
    Sentry.captureMessage('test');
  },
  function() {
    Sentry.captureMessage('test');
  },
);
