import { isReleaseName } from './common';
import { DirectoryInfo, ErrorType, Validate, ValidateCondition } from '../types';

const rarMp3Reg = /^(.+\.(r\d{2}|0\d{2}|mp3|flac))$/i;
const mvidReg = /^(.+\.(m2v|avi|mkv|mp(e)?g))$/i;


const hasFiles = (files: string[], reg: RegExp) => {
  return files.some(file => reg.test(file));
};

const isSfvDirectory = (directory: DirectoryInfo) => {
  if (hasFiles(directory.files, rarMp3Reg)) {
    return true;
  }

  if (isReleaseName(directory.name) && hasFiles(directory.files, mvidReg)) {
    return true;
  }

  return false;
};

const validate: Validate = async (directory, reporter) => {
  // SFV files may also be inside subdirectory (directory name detection can't be used)
  if (!directory.sfvFiles.length && isSfvDirectory(directory)) {
    reporter.addFolder(directory.path, 'sfv_missing', 'SFV file possibly missing', ErrorType.ITEMS_MISSING);
  }
};

const validateCondition: ValidateCondition = directory => !directory.sfvFiles.length;

export default {
  validateCondition,
  validate,
  setting: {
    key: 'missing_sfv',
    title: 'Check missing SFV files',
    default_value: true,
    type: 'boolean'
  },
}
