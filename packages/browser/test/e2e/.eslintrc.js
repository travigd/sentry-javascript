module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  // This rule gives false positives on GH Actions.
  // Ref: https://github.com/import-js/eslint-plugin-import/issues/1037
  rules: {
    'import/no-unresolved': 'off',
  },
  extends: ['../../.eslintrc.js'],
  ignorePatterns: ['scenarios/**'],
};
