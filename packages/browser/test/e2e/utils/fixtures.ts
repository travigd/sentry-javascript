import { test as base } from '@playwright/test';
import path from 'path';

export type TestOptions = {
  testDir: string;
};

export type TestFixtures = {
  testDir: string;
  getLocalTestPath: (options: TestOptions) => Promise<string>;
};

const test = base.extend<TestFixtures>({
  getLocalTestPath: ({}, use) => {
    return use(async ({ testDir }) => {
      return `file:///${path.resolve(testDir, './dist/index.html')}`;
    });
  },
});

export default test;
