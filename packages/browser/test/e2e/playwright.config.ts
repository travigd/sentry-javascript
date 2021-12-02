import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  retries: 2,
  timeout: 12000,
};
export default config;
