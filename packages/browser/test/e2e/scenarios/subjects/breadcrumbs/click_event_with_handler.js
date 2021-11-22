// add an event listener to the input. we want to make sure that
// our breadcrumbs still work even if the page has an event listener
// on an element that cancels event bubbling
const input = document.getElementsByTagName('input')[0];
const clickHandler = function(evt) {
  evt.stopPropagation(); // don't bubble
};
input.addEventListener('click', clickHandler);

// click <input/>
const click = new MouseEvent('click');
input.dispatchEvent(click);

Sentry.captureMessage('test');
