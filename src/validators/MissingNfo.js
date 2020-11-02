import fs from 'async-file';
import path from 'path';
import { ErrorType } from '../ErrorCollector';

import { isReleaseName } from './common';


const subDirReg = /^(((DVD|CD|DIS(K|C)).?([0-9](0-9)?))|Sample|Cover(s)?|.{0,5}Sub(s)?)$/i;


// Checks if there are NFOs in any of the subdirectories
const findNfo = (directory) => {
  const isSubdir = name => subDirReg.test(name);

  const isNfo = name => path.extname(name).toLowerCase() === '.nfo';

  const scanSubdirectory = async (parentPath, folderName) => {
    const fullPath = path.join(directory.path, folderName);

    try {
      const contentList = await fs.readdir(fullPath);
      return contentList.find(isNfo);
    } catch (e) {
      console.error(`Failed to scan the path ${fullPath}: ${e}`);
    }

    return false;
  };

  return directory.folders
        .filter(isSubdir)
        .find(scanSubdirectory.bind(this, directory.path));
};
 
const validate = async (directory, reporter) => {
  // NFO file should generally be under the root release directory
  //
  // If all child directories are releases, don't report anything 
  // (children will be validated separately later in any case)
  if (!directory.nfoFiles.length && isReleaseName(directory.name) && (!directory.folders.length || !directory.folders.every(isReleaseName))) {
    let found = false;
    if (!directory.files.length) {
      // Certain (old) releases may have NFO files inside the subdirectories
      // (luckily this shouldn't happen often)
      found = await findNfo(directory);
    }

    if (!found) {
      reporter.addFolder(directory.path, 'nfo_missing', 'NFO file possibly missing', ErrorType.FILES_MISSING);
    }
  }
};

const validateCondition = directory => !directory.nfoFiles.length;
 
export default {
  validateCondition,
  validate,
  setting: {
    key: 'missing_nfo',
    title: 'Check missing NFO files',
    default_value: true,
    type: 'boolean'
  },
}
