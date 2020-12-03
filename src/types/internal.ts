// ERRORS
export enum ErrorType {
  ITEMS_MISSING = 'items_missing',
  EXTRA_ITEMS = 'extra_items',
  INVALID_CONTENT = 'invalid_content',
};

export type ErrorCallback = (path: string, errorId: string, message: string, errorType: ErrorType) => void;

export interface ErrorReporter {
  addFolder: ErrorCallback;
  addFile: ErrorCallback;
}

export type ErrorLogger = (path: string, message: string) => void;


// VALIDATORS
export interface DirectoryInfo {
  name: string;
  path: string;
  files: string[],
  folders: string[],
  sfvFiles: string[],
  nfoFiles: string[],
}

export type ValidateCondition = (directory: DirectoryInfo) => boolean;

export type Validate = (directory: DirectoryInfo, errorReporter: ErrorReporter) => void | Promise<void>;

export interface Validator {
  validateCondition: ValidateCondition;
  validate: Validate;
}
