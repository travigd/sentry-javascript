const input = document.getElementsByTagName('input')[0];
input.addEventListener('click', undefined);
input.addEventListener('keypress', undefined);

const click = new MouseEvent('click');
input.dispatchEvent(click);

const keypress = new KeyboardEvent('keypress');
input.dispatchEvent(keypress);

Sentry.captureMessage('test');
