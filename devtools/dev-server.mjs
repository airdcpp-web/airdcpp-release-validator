import fs from 'fs';
import path from 'path';

import { RemoteExtension } from 'airdcpp-extension';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionConfig = {
  packageInfo: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')),
  dataPath: __dirname,
  nameSuffix: '-dev',
};

import settings from './settings.mjs';

import(process.argv[2] || '../dist/main.js').then(entry => {
  // See https://github.com/airdcpp-web/airdcpp-extension-js for usage information
  RemoteExtension(
    entry.default, 
    !process.env.PROFILING ? settings : {
      ...settings,
      logLevel: 'error', // Avoid spam while profiling...
    }, 
    extensionConfig
  );
})

