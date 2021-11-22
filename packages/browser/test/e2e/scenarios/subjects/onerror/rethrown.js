try {
  foo();
} catch (e) {
  Sentry.captureException(e);
  throw e; // intentionally re-throw
}
