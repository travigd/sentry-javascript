# Integration Tests for Sentry Browser SDK

Integration tests for Sentry's Browser SDK use [Playwright](https://playwright.dev/) internally. These tests are run on latest stable versions of Chromium, Firefox and Webkit.

## Structure

The tests are grouped by their scope such as `breadcrumbs` or `onunhandledrejection`. In every group of tests, there are multiple folders containing test cases with their optional supporting assets.

Each case group has a default HTML skeleton named `template.hbs`, and also a default initialization script named `init.js `, which contains the `Sentry.init()` call. These defaults are used as fallbacks when a specific `template.hbs` or `init.js` is not defined in a case folder.

Each case folder need to have two required files, `subject.js`, the script that will be run inside browser that interacts with Sentry SDK, and `test.ts` which is the set of assertions about the outcome of the setup defined in `subject.js`. Optionally, an `init.js` or `template.hbs` can be defined if required, each one of them will have precedence over the default definitions of the test group.

```
suites/
|---- breadcrumbs/
      |---- template.hbs [fallback template for breadcrumb tests]
      |---- init.js [fallback init for breadcrumb tests]
      |---- click_event_tree/
            |---- template.hbs [optional case specific template]
            |---- init.js [optional case specific init]
            |---- subject.js [required]
            |---- test.ts [assertions]
```

## Writing Tests

### Helpers

`utils/helpers.ts` contains helpers that could be used in assertions (`test.ts`). These helpers define a convenient and reliable API to interact with Playwright's native API. It's highly recommended to define all common patterns of Playwright usage in helpers.

`utils/browserHelpers.ts` contains helpers that are used in browser subjects (`subject.ts`). They are convenient to reduce duplication on injected code into browser environment.

### Fixtures

[Fixtures](https://playwright.dev/docs/api/class-fixtures) allows us to define the globals and test-specific information in assertion groups (`test.ts` files). In it's current state, `fixtures.ts` contains an extension over the pure version of `test()` function of Playwright. All the tests should import `test` function from `utils/fixtures.ts` instead of `@playwright/test` to be able to access the extra fixtures.

### Troubleshooting

Apart from [Playwright-specific issues](https://playwright.dev/docs/troubleshooting), below are common issues that might occur while writing tests for Sentry Browser SDK.

- #### Flaky Tests
  If a test fails randomly, giving a `Page Closed`, `Target Closed` or a similar error, most of the times, the reason is a race condition between the page action defined in the `subject` and the listeners of the Sentry event / request. It's recommended to firstly check `utils/helpers.ts` whether if that async logic can be replaced by one of the helpers. If not, whether the awaited (or non-awaited on purpose in some cases) Playwright methods can be orchestrated by [`Promise.all`](http://mdn.io/promise.all). Manually-defined waiting logic such as timeouts are not recommended, and should not be required in most of the cases.

- #### Build Errors
  Before running, a page for each test case is built under the case folder inside `dist`. If a page build is failed, it's recommended to check:

  - If both default `template.hbs` and `init.js` are defined for the test group.
  - If a `subject.js` is defined for the test case.
  - If either of `init.js` or `subject.js` contain non-browser code.
  - If `utils/browserHelpers.ts` contain non-browser code.
  - If the webpack configuration is valid.
