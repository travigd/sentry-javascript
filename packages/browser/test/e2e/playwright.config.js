const config = {
  // Retries for cases that might be flaky
  // Even if the test passes the second time, it's reported as flaky
  // But the suite is considered successful.
  retries: 2,
  webServer: {
    command: 'node server.js',
    port: 8080,
    timeout: 120 * 1000,
  },
};

module.exports = config;
