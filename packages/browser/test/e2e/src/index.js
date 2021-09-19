const Sentry = require('@sentry/browser');

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
});
