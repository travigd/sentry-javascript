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
  extends: ['../../.eslintrc.js', 'plugin:import/typescript'],
  ignorePatterns: ['scenarios/**'],
};
