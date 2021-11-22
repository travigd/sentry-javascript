// keypress <input/> twice
const keypress1 = new KeyboardEvent('keypress');
const keypress2 = new KeyboardEvent('keypress');

const input = document.getElementsByTagName('input')[0];
input.addEventListener('keypress');

input.dispatchEvent(keypress1);
input.dispatchEvent(keypress2);

Sentry.captureMessage('test');
