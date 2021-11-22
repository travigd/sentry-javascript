const input = document.getElementsByTagName('input')[0];

const clickHandler = function() {};
const otherClickHandler = function() {};
input.addEventListener('click', clickHandler);
input.addEventListener('click', otherClickHandler);
input.removeEventListener('click', clickHandler);
input.removeEventListener('click', otherClickHandler);

const keypressHandler = function() {};
const otherKeypressHandler = function() {};
input.addEventListener('keypress', keypressHandler);
input.addEventListener('keypress', otherKeypressHandler);
input.removeEventListener('keypress', keypressHandler);
input.removeEventListener('keypress', otherKeypressHandler);

input.dispatchEvent(new MouseEvent('click'));
input.dispatchEvent(new KeyboardEvent('keypress'));

Sentry.captureMessage('test');
