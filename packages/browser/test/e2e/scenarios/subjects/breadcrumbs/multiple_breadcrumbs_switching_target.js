const input = document.querySelector('#foo-form input');
const div = document.querySelector('#foo-form div');

const clickHandler = function() {};
input.addEventListener('click', clickHandler);
div.addEventListener('click', clickHandler);

input.dispatchEvent(new MouseEvent('click'));
div.dispatchEvent(new MouseEvent('click'));

Sentry.captureMessage('test');
