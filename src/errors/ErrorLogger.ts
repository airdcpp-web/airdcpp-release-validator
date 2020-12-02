import { ErrorLogger, SeverityEnum } from 'types';


export const MemoryErrorLogger = () => {
  let str = '';

  const logger: ErrorLogger = (path, error) => {
    if (!!str.length) {
      str += '\n';
    }

    str += error;
  };

  return {
    logger,
    getLog: () => str,
  };
};

export const getApiErrorLogger = (postEvent: (message: string, severity: SeverityEnum) => any) => {
  const ApiErrorLogger: ErrorLogger = (path: string, message: string) => {
    postEvent(`${path}: ${message}`, SeverityEnum.WARNING);
  };

  return ApiErrorLogger;
};