fetch('/base/subjects/example.json', {
  method: 'GET',
}).then(
  function() {
    Sentry.captureMessage('test');
  },
  function() {
    Sentry.captureMessage('test');
  },
);
