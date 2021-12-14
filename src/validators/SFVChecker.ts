import path from 'path';
import SFVReader from '../helpers/SFVReader';
import { ErrorType, Validate, ValidateCondition } from '../types';
 
 
const audioBookExtrasReg = /^(.+\.(jp(e)?g|png|m3u|cue|zip|sfv|nfo))$/i;
const flacExtrasReg = /^(.+\.(jp(e)?g|png|m3u|cue|log|sfv|nfo))$/i;
const normalExtrasReg = /^(.+\.(jp(e)?g|png|m3u|cue|diz|sfv|nfo))$/i;
 
const audioBookReg = /^(.+(-|\()AUDIOBOOK(-|\)).+)$/i;
const flacReg = /^(.+(-|\()(LOSSLESS|FLAC)((-|\)).+)?)$/i;
 
 
// Get regex for allowed extra files (type is detected from the directory name)
const getExtrasReg = (name: string) => {
  if (audioBookReg.test(name)) {
    return audioBookExtrasReg;
  } else if (flacReg.test(name)) {
    return flacExtrasReg;
  }

  return normalExtrasReg;
};
 
const validateCondition: ValidateCondition = directory => !!directory.sfvFiles.length;

const isSfvOrNfo = (name: string) => {
  const ext = path.extname(name);
  return ext === '.nfo' || ext === '.sfv';
};
 
const validate: Validate = async (directory, reporter) => {
  // Name comparisons should be case insensitive
  // as wrong case sizing in SFV files is rather common
  // Keep the original names available for reporting
  const diskFiles: { [key in string]: string } = {};
  directory.files.forEach(name => diskFiles[name.toLowerCase()] = name);


  // Load SFV files
  const reader = SFVReader(directory.path);

  let loadedSfvFiles = 0;
  await Promise.all(directory.sfvFiles.map(async (file) => {
    try {
      await reader.load(file);
      loadedSfvFiles++;
    } catch (e) {
      reporter.addFile(file, 'invalid_sfv_file', e.message, ErrorType.INVALID_CONTENT);
    }
  }));

  if (!loadedSfvFiles) {
    return;
  }

  // Iterate through the SFV file and compare with the content
  // Matching files are removed so that we can detect extras
  Object.keys(reader.content).forEach(sfvFile => {
    const sfvFileLower = sfvFile.toLowerCase();

    // Some (bad) SFV files also list NFO/SFV files... don't report them
    if (!diskFiles[sfvFileLower] && !isSfvOrNfo(sfvFileLower)) {

      // Only ignored from share?
      if (directory.ignoredFiles.find(ignoredFile => ignoredFile.toLowerCase() === sfvFileLower)) {
        reporter.addFile(sfvFile, 'file_ignored', 'File listed in the SFV file is ignored from share', ErrorType.INVALID_CONTENT);
      } else {
        reporter.addFile(sfvFile, 'file_missing', 'File listed in the SFV file does not exist on disk', ErrorType.ITEMS_MISSING);
      }

    } else {
      delete diskFiles[sfvFileLower];
    }
  });

  // Extra files
  if (Object.keys(diskFiles).length > 0) {
    const extrasReg = getExtrasReg(directory.name);
    Object.values(diskFiles).forEach(diskFile => {
      if (!extrasReg.test(diskFile)) {
        reporter.addFile(diskFile, 'extra_files', 'Extra files in release directory', ErrorType.EXTRA_ITEMS);
      }
    });
  }
};
 
export default {
  validateCondition,
  validate,
  setting: {
    key: 'scan_sfv_file',
    title: 'Check content based on SFV files',
    default_value: true,
    type: 'boolean'
  },
}
