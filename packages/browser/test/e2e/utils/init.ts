import glob from 'glob';
import fs from 'fs';
import path from 'path';
import { generatePage } from './generatePage';

const getSubjects = function(): string[] {
  return glob.sync('suites/**/subject.js');
};

const getAsset = function(subjectPath: string, asset: string) {
  const assetDir = path.dirname(subjectPath);

  if (fs.existsSync(`${assetDir}/${asset}`)) {
    return `${assetDir}/${asset}`;
  } else {
    return `${path.dirname(assetDir)}/${asset}`;
  }
};

export default async () => {
  const subjects = getSubjects();

  for (const subject of subjects) {
    const outPath = path.dirname(subject);
    const template = getAsset(subject, 'template.hbs');
    const init = getAsset(subject, 'init.js');

    await generatePage(init, subject, template, outPath);
  }
};
