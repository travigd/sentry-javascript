const clickHandler = function() {};

// mousemove event shouldnt clobber subsequent "breadcrumbed" events (see #724)
document.querySelector('.a').addEventListener('mousemove', clickHandler);

document.querySelector('.a').addEventListener('click', clickHandler);
document.querySelector('.b').addEventListener('click', clickHandler);
document.querySelector('.c').addEventListener('click', clickHandler);

// click <input/>
const click = new MouseEvent('click');
const input = document.querySelector('.a'); // leaf node
input.dispatchEvent(click);

Sentry.captureMessage('test');
