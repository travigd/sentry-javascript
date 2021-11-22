// 1st keypress <input/>
const keypress1 = new KeyboardEvent('keypress');
// click <input/>
const click = new MouseEvent('click');
// 2nd keypress
const keypress2 = new KeyboardEvent('keypress');

const input = document.getElementsByTagName('input')[0];
input.addEventListener('keypress');
input.addEventListener('click');

input.dispatchEvent(keypress1);
input.dispatchEvent(click);
input.dispatchEvent(keypress2);

Sentry.captureMessage('test');
