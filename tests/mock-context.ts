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
  axios?: any;
}

export const MockApplicationInfo: ApplicationInfo = {
  server: {
    address: 'mock_url',
    secure: false,
  },
  session: {
    token: 'mock-token',
    tokenType: 'mock-token-type',
  },
}

export const getMockContext = (api: APIType, options: Partial<MockContextOptions> = {}) => {
  const context: Context = {
    api,
    axios: options.axios || (() => {}) as any,
    logger, 
    extensionName: 'test-extension',
    configGetter: () => ({
      validators,
      ignoreExcluded: options.configOverrides?.ignoreExcluded || false,
    }),
    application: MockApplicationInfo,
  };

  return context;
};