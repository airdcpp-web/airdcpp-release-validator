import invariant from 'invariant';
import { DirectoryInfo, ErrorCallback, ErrorLogger, ErrorType } from '../types';


interface ErrorInfo {
  files: string[];
  hasFolderError: boolean;
  message: string,
}

interface TotalErrorReporter {
  add: (errorId: string, message: string, errorType: ErrorType) => void;
}

export const ValidatorErrorReporter = (directoryInfo: DirectoryInfo, totalErrors: TotalErrorReporter, errorLogger: ErrorLogger) => {
  const validatorErrors: { [key in string]: ErrorInfo } = {};

  const reduceMessage = (reducedText: string, fileName: string, index: number) => {
    return reducedText + (index !== 0 ? ', ' : '') + fileName;
  };

  // Initialize a new error object or return an existing one
  const getError = (errorId: string, message: string) => {
    invariant(typeof message === 'string', `Error message is not a string: ${message}`);
    
    validatorErrors[errorId] = validatorErrors[errorId] || {
      files: [],
      hasFolderError: false,
      message,
    };

    return validatorErrors[errorId];
  };

  // Logs the errors after validation has completed
  const flush = () => {
    Object.keys(validatorErrors).forEach(id => {
      const error = validatorErrors[id];

      if (error.files.length) {
        const itemListStr = error.files.reduce(reduceMessage, '');
        errorLogger(`${directoryInfo.path}: ${error.message} (${error.files.length} file(s): ${itemListStr})`);
      }

      if (error.hasFolderError) {
        errorLogger(`${directoryInfo.path}: ${error.message}`);
      }
    });
  };

  const addFile: ErrorCallback = (fileName, errorId, message, errorType) => {
    getError(errorId, message).files.push(fileName);
    totalErrors.add(errorId, message, errorType);
  };

  const addFolder: ErrorCallback = (folderPath, errorId, message, errorType) => {
    getError(errorId, message).hasFolderError = true;
    totalErrors.add(errorId, message, errorType);
  };

  return {
    addFile,
    addFolder,
    flush,
  };
};