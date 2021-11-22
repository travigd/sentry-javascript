fetch(new Request('/base/subjects/example.json')).then(
  function() {
    Sentry.captureMessage('test');
  },
  function() {
    Sentry.captureMessage('test');
  },
);
