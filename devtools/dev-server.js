const fs = require('fs');
const path = require('path');

const RemoteExtension = require('airdcpp-extension').RemoteExtension;

const extensionConfig = {
  packageInfo: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')),
  dataPath: __dirname,
  nameSuffix: '-dev',
};

const settings = require('./settings.js');

// See https://github.com/airdcpp-web/airdcpp-extension-js for usage information
RemoteExtension(
  require(process.argv[2] || '../dist/main.js'), 
  !process.env.PROFILING ? settings : {
    ...settings,
    logLevel: 'error', // Avoid spam while profiling...
  }, 
  extensionConfig
);