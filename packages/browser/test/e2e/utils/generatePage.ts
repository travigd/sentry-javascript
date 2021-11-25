import { existsSync, mkdirSync } from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import webpackConfig from '../webpack.config';

export async function generatePage(
  initialization: string,
  subject: string,
  template: string,
  outPath: string,
): Promise<void> {
  const localPath = `${path.resolve(__dirname, '..')}/${outPath}/dist`;
  const initializationPath = `${path.resolve(__dirname, '..')}/${initialization}`;
  const subjectPath = `${path.resolve(__dirname, '..')}/${subject}`;
  const templatePath = `${path.resolve(__dirname, '..')}/${template}`;

  const bundlePath = `${localPath}/index.html`;

  if (!existsSync(localPath)) {
    mkdirSync(localPath, { recursive: true });
  }

  if (!existsSync(bundlePath)) {
    await new Promise<void>((resolve, reject) => {
      webpack(
        webpackConfig({
          entry: {
            initialization: initializationPath,
            subject: subjectPath,
          },
          output: {
            path: localPath,
            filename: '[name].bundle.js',
          },
          plugins: [
            new HtmlWebpackPlugin({
              filename: 'index.html',
              template: templatePath,
              initialization: 'initialization.bundle.js',
              subject: `subject.bundle.js`,
              inject: false,
            }),
          ],
        }),
      ).run(err => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  }
}
