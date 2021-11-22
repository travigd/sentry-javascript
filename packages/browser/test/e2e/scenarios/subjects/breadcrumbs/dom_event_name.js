const input = document.getElementsByTagName('input')[0];
const clickHandler = function() {};
input.addEventListener('click', clickHandler);
const click = new MouseEvent('click');
input.dispatchEvent(click);
Sentry.captureMessage('test');
