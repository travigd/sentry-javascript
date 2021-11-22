import { test as base } from '@playwright/test';
import path from 'path';

import { generatePage } from './generatePage';

export type TestOptions = {
  initialization?: string;
  subject?: string;
  template?: string;
};

export type TestFixtures = {
  subjectCategory: string;
  getScenario: (options: TestOptions) => Promise<string>;
};

const test = base.extend<TestFixtures>({
  subjectCategory: '',
  baseURL: `file://${path.resolve(__dirname, '../dist')}`,
  getScenario: async ({ baseURL, subjectCategory }, use) => {
    return await use(async ({ initialization = 'default', subject = 'default', template = 'default' }) => {
      const subjectPath = `${subjectCategory}/${subject}`;
      const internalPath = `${initialization}/${subjectPath}/${template}`;
      const url = `${baseURL}/${internalPath}/index.html`;

      await generatePage(initialization, subjectPath, template);
      return url;
    });
  },
});

export default test;
