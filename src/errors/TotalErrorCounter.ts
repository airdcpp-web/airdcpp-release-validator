import { ErrorType } from '../types';


interface ErrorCount {
  count: number;
  message: string;
  type: ErrorType;
}

export const TotalErrorCounter = () => {
  const errors: { [key in string]: ErrorCount } = {};

  // REPORTING
  const formatErrorCount = (error: ErrorCount) => {
    let message = error.message;

    // Decapitalize
    if (message.charAt(1) === message.charAt(1).toLowerCase()) {
      message = message.charAt(0).toLowerCase() + message.substr(1);
    }

    return `${message} (count: ${error.count})`
  };

  const reduceMessage = (reducedText: string, errorId: string, index: number) => {
    return reducedText + (index !== 0 ? ', ' : '') + formatErrorCount(errors[errorId]);
  };

  const format = () => {
    return Object.keys(errors).reduce(reduceMessage, '');
  };


  // ADDING ERRORS
  const add = (errorId: string, message: string, errorType: ErrorType) => {
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
  const count = (errorId?: string) => {
    if (errorId) {
      return errors[errorId] ? errors[errorId].count : 0;
    }

    return Object.keys(errors).reduce((total, id) => {
      return total + errors[id].count;
    }, 0);
  };

  // Return a hook rejection error when all errors have the wanted type
  const getHookError = (errorType: ErrorType) => {
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
      const error = getHookError(ErrorType.ITEMS_MISSING);
      if (!!error) {
        return error;
      }
    }

    // Only extra files?
    {
      const error = getHookError(ErrorType.EXTRA_ITEMS);
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