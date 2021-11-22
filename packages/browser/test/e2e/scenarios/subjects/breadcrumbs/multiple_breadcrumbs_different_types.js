const input = document.getElementsByTagName('input')[0];

const clickHandler = function() {};
input.addEventListener('click', clickHandler);
const keypressHandler = function() {};
input.addEventListener('keypress', keypressHandler);

input.dispatchEvent(new MouseEvent('click'));
input.dispatchEvent(new KeyboardEvent('keypress'));

Sentry.captureMessage('test');
