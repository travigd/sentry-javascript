import { existsSync, mkdirSync } from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import webpackConfig from '../webpack.config';

const scenariosPath = path.resolve(__dirname, '../scenarios');
const initializationsPath = `${scenariosPath}/initializations`;
const subjectsPath = `${scenariosPath}/subjects`;
const templatesPath = `${scenariosPath}/templates`;

export async function generatePage(initialization: string, subject: string, template: string): Promise<void> {
  const internalPath = `${initialization}/${subject}/${template}`;
  const localPath = `${path.resolve(__dirname, '../dist')}/${internalPath}`;
  const bundlePath = `${localPath}/index.html`;

  if (!existsSync(localPath)) {
    mkdirSync(localPath, { recursive: true });
  }

  if (!existsSync(bundlePath)) {
    await new Promise((resolve, reject) => {
      webpack(
        webpackConfig({
          entry: {
            initialization: `${initializationsPath}/${initialization}`,
            subject: `${subjectsPath}/${subject}`,
          },
          output: {
            path: localPath,
            filename: '[name].bundle.js',
          },
          plugins: [
            new HtmlWebpackPlugin({
              filename: 'index.html',
              template: `${templatesPath}/${template}.hbs`,
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
