import invariant from 'invariant';


export const ErrorType = {
  FILES_MISSING: 'files_missing',
  EXTRA_FILES: 'extra_files',
  INVALID_CONTENT: 'invalid_content',
};

export const ValidatorErrorReporter = (directoryInfo, totalErrors, logger) => {
  const validatorErrors = {};

  const reduceMessage = (reducedText, fileName, index) => {
    return reducedText + (index !== 0 ? ', ' : '') + fileName;
  };

  // Initialize a new error object or return an existing one
  const getError = (errorId, message) => {
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
        logger(`${directoryInfo.path}: ${error.message} (${error.files.length} file(s): ${itemListStr})`);
      }

      if (error.hasFolderError) {
        logger(`${directoryInfo.path}: ${error.message}`);
      }
    });
  };

  const addFile = (fileName, errorId, message, errorType) => {
    getError(errorId, message).files.push(fileName);
    totalErrors.add(errorId, message, errorType);
  };

  const addFolder = (folderPath, errorId, message, errorType) => {
    getError(errorId, message).hasFolderError = true;
    totalErrors.add(errorId, message, errorType);
  };

  return {
    addFile,
    addFolder,
    flush,
  };
};

export const TotalErrorCounter = () => {
  const errors = {};

  // REPORTING
  const formatErrorCount = (error) => {
    let message = error.message;

    // Decapitalize
    if (message.charAt(1) === message.charAt(1).toLowerCase()) {
      message = message.charAt(0).toLowerCase() + message.substr(1);
    }

    return `${message} (count: ${error.count})`
  };

  const reduceMessage = (reducedText, errorId, index) => {
    return reducedText + (index !== 0 ? ', ' : '') + formatErrorCount(errors[errorId]);
  };

  const format = () => {
    return Object.keys(errors).reduce(reduceMessage, '');
  };


  // ADDING ERRORS
  const add = (errorId, message, errorType) => {
    errors[errorId] = errors[errorId] || {
      count: 0,
      message,
      type: errorType,
    };

    errors[errorId].count++;
  };


  // MISC

  // Get error count by type
  // If no type is specified, total error count is returned
  const count = (errorId) => {
    if (errorId) {
      return errors[errorId] ? errors[errorId].count : 0;
    }

    return Object.keys(errors).reduce((total, id) => {
      return total + errors[id].count;
    }, 0);
  };

  // Return a hook rejection error when all errors have the wanted type
  const getError = (errorType) => {
    if (Object.keys(errors).every(key => errors[key].type === errorType)) {
      const id = Object.keys(errors)[0];
      return {
        id: errorType,
        message: errors[id].message,
      };
    }

    return null;
  };

  // Return a single hook rejection error
  const pickOne = () => {
    // Prefer missing errors because of auto search
    {
      const error = getError(ErrorType.FILES_MISSING);
      if (!!error) {
        return error;
      }
    }

    // Only extra files?
    {
      const error = getError(ErrorType.EXTRA_FILES);
      if (!!error) {
        return error;
      }
    }

    // Return a generic error
    const id = Object.keys(errors)[0];
    return {
      id: ErrorType.INVALID_CONTENT,
      message: errors[id].message,
    };
  };

  return {
    add,
    count,
    format,
    pickOne,
    getErrors: () => errors,
  };
};