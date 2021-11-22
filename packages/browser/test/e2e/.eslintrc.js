module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  extends: ['../../.eslintrc.js', 'plugin:playwright/playwright-test'],
};
