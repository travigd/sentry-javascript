const input = document.getElementsByTagName('input')[0];
input.addEventListener('build', undefined);

const customEvent = new CustomEvent('build', { detail: 1 });
input.dispatchEvent(customEvent);

Sentry.captureMessage('test');
