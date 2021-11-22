history.pushState({}, '', '/foo');
history.pushState({}, '', '/bar?a=1#fragment');
history.pushState({}, '', {}); // pushState calls toString on non-string args
history.pushState({}, '', null); // does nothing / no-op
// can't call history.back() because it will change url of parent document
// (e.g. document running mocha) ... instead just "emulate" a back button
// press by calling replaceState
history.replaceState({}, '', '/bar?a=1#fragment');
Sentry.captureMessage('test');
