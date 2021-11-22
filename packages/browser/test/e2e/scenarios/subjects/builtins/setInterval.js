const exceptionInterval = setInterval(function() {
  clearInterval(exceptionInterval);
  foo();
}, 0);
