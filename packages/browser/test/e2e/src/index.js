const Sentry = require('@sentry/browser');
const { normalize } = require('@sentry/utils');
window.Sentry = Sentry;

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  integrations: [new Sentry.Integrations.Dedupe()],
  attachStacktrace: true,
  ignoreErrors: ['ignoreErrorTest'],
  denyUrls: ['foo.js'],
  beforeBreadcrumb: function(breadcrumb, breadcrumbHint) {
    // Remove circular properties from event target
    // Store `breadcrumbHint` inside `breadcrumb` for tests
    if (breadcrumbHint) {
      breadcrumb.hint = normalize(breadcrumbHint);
    }

    return breadcrumb;
  },
});
