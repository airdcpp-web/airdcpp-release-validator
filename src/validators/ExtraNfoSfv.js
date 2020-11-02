import path from 'path';
import { ErrorType } from '../ErrorCollector';

const emptyDirReg = /^(\S*(((nfo|dir).?fix)|nfo.only)\S*)$/i;

const validate = async (directory, reporter) => {
  if (directory.nfoFiles.length > 1) {
    reporter.addFolder(directory.path, 'multiple_nfo_files', 'Multiple NFO files', ErrorType.EXTRA_ITEMS);
  }

  if (directory.sfvFiles.length > 1) {
    reporter.addFolder(directory.path, 'multiple_sfv_files', 'Multiple SFV files', ErrorType.EXTRA_ITEMS);
  }

  if (!directory.files.length && !directory.folders.length && (directory.sfvFiles.length || directory.nfoFiles.length)) {
    if (!emptyDirReg.test(directory.name)) {
      reporter.addFolder(directory.path, 'no_release_files', 'NFO/SFV found but there are no other files in the folder', ErrorType.ITEMS_MISSING);
    }
  }
};

const validateCondition = directory => directory.nfoFiles.length || directory.sfvFiles.length;
 
export default {
  validateCondition,
  validate,
  setting: {
    key: 'extra_nfo_sfv',
    title: 'Check extra NFO/SFV files',
    default_value: true,
    type: 'boolean'
  },
}
