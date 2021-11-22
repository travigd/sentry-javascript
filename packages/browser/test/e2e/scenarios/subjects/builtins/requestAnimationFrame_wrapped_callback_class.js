// TypeScript-transpiled class syntax
const Foo = (function() {
  function Foo() {
    const _this = this;
    this.magicNumber = 42;
    this.getThis = function() {
      window.capturedCtx = _this;
      // Capturing a message to trigger `getSentryRequest`.
      Sentry.captureMessage('foo');
    };
  }
  return Foo;
})();
const foo = new Foo();
requestAnimationFrame(foo.getThis);
