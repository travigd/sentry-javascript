window.calls = {};
const xhr = new XMLHttpRequest();
xhr.open('GET', '/base/subjects/example.json');
xhr.onreadystatechange = function wat() {
  window.calls[xhr.readyState] = window.calls[xhr.readyState] ? window.calls[xhr.readyState] + 1 : 1;
  if (xhr.readyState === 4) {
    // Capturing a message to trigger `getSentryRequest`.
    Sentry.captureMessage('foo');
  }
};
xhr.send();
