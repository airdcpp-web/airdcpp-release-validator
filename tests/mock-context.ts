import validators from 'validators';
import { Context, Config, ApplicationInfo } from 'types';

import { MockLogger as logger } from './helpers';
import { APIType } from 'api';


export const getMockApi = (customHandlers: Partial<APIType> = {}): APIType => {
  const api = {
    ...customHandlers,
    postEvent: () => {
      return Promise.resolve();
    },
  } as Partial<APIType>;

  return api as APIType;
};

export interface MockContextOptions {
  configOverrides?: Partial<Config>;
  fetch?: (url: string, options: object) => Promise<any>;
}

export const MOCK_RESULT_LOG_NAME = 'mock_log_name';

export const MockApplicationInfo: ApplicationInfo = {
  server: {
    address: 'mock_url',
    secure: false,
  },
  session: {
    token: 'mock-token',
    tokenType: 'mock-token-type',
  },
  cid: 'mock-cid'
}

export const getMockContext = (api: APIType, options: Partial<MockContextOptions> = {}) => {
  const context: Context = {
    api,
    fetch: options.fetch || (() => {}) as any,
    logger, 
    extensionName: 'test-extension',
    configGetter: () => ({
      validators,
      ignoreExcluded: options.configOverrides?.ignoreExcluded || false,
      separateLogFile: options.configOverrides?.separateLogFile || false,
    }),
    generateResultLogName: () => MOCK_RESULT_LOG_NAME,
    application: MockApplicationInfo,
  };

  return context;
};