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


const reduceFilesMessage = (reducedText: string, fileName: string, index: number) => {
  return reducedText + (index !== 0 ? ', ' : '') + fileName;
};

const toErrorMessage = (error: ErrorInfo) => {
  let messageStr = `${error.message} (${error.files.length} file(s)`;
  if (error.files.length < 25) {
    // List all files
    messageStr += error.files.reduce(reduceFilesMessage, '');
  } else {
    // List the first 20 files (there can hundreds of them)
    messageStr += error.files.slice(0, 20).reduce(reduceFilesMessage, '');
    messageStr += ` and ${error.files.length - 20} more`;
  }

  messageStr += ')';
  return messageStr;
}

export const ValidatorErrorReporter = (directoryInfo: DirectoryInfo, totalErrors: TotalErrorReporter, errorLogger: ErrorLogger) => {
  const validatorErrors: { [key in string]: ErrorInfo } = {};

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
        const message = toErrorMessage(error);
        errorLogger(directoryInfo.path, message);
      }

      if (error.hasFolderError) {
        errorLogger(directoryInfo.path, error.message);
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