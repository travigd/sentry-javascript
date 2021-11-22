window.dispatchEvent(
  new CustomEvent('unhandledrejection', {
    detail: {
      promise: new Promise(function() {}),
      reason: new Error('test-2'),
    },
  }),
);
