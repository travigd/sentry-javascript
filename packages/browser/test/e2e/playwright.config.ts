import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  retries: 2,
  timeout: 12000,
  globalSetup: './utils/init.ts',
};
export default config;
