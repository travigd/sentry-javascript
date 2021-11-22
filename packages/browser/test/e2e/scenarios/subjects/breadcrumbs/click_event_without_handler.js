// click <input/>
const click = new MouseEvent('click');

const input = document.getElementsByTagName('input')[0];

// TODO: This next line wasn't required for the old tests.
input.addEventListener('click');
input.dispatchEvent(click);

Sentry.captureMessage('test');
