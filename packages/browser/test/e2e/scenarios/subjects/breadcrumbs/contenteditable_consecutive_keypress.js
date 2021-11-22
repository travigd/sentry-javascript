// keypress <input/> twice
const keypress1 = new KeyboardEvent('keypress');
const keypress2 = new KeyboardEvent('keypress');

const div = document.querySelector('[contenteditable]');
div.addEventListener('keypress');

div.dispatchEvent(keypress1);
div.dispatchEvent(keypress2);

Sentry.captureMessage('test');
