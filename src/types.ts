
import { APISocket } from 'airdcpp-apisocket';
import { AddressInfo } from 'airdcpp-extension';

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


// API
export interface ChatCommandData {
  command: string;
  args: string[];
  permissions: string[];
}

export interface SessionInfo {
  system_info: {
    // path_separator: string;
    api_feature_level: number;
  };
  auth_token: string;
  token_type: string;
}

export interface Bundle {
  type: {
    id: string;
  };
  target: string;
  name: string;
}

export interface SharePathHookData {
  path: string;
  new_parent: boolean;
}

export interface ShareRoot {
  path: string;
}

export interface GroupedPath {
  paths: string[];
}

export const enum SeverityEnum {
  NOTIFY = 'notify',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

// CONTEXT
interface Config {
  ignoreExcluded: boolean;
  validators: Validator[];
}

type ConfigGetter = () => Config;

interface ApiInfo extends AddressInfo {
  token: string;
  tokenType: string;
}
export interface Context {
  socket: APISocket;
  configGetter: ConfigGetter;
  extensionName: string;
  api: ApiInfo;
}
