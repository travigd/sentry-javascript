window.handleEventCalled = false;

const input = document.getElementsByTagName('input')[0];
input.addEventListener('click', {
  handleEvent: function() {
    window.handleEventCalled = true;
  },
});
input.dispatchEvent(new MouseEvent('click'));

Sentry.captureMessage('test');
