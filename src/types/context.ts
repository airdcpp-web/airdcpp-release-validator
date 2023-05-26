import { ServerInfo } from 'airdcpp-extension';
import { Validator } from './internal';
import { APIType } from 'api';
import { Logger } from 'airdcpp-apisocket';

import fetch from 'node-fetch';


// CONTEXT
export interface Config {
  ignoreExcluded: boolean;
  separateLogFile: boolean;
  validators: Validator[];
}

type ConfigGetter = () => Config;

export interface ApplicationInfo {
  server: ServerInfo;
  session: {
    token: string;
    tokenType: string;
  };
  cid: string;
}
export interface Context {
  configGetter: ConfigGetter;
  extensionName: string;
  application: ApplicationInfo;
  api: APIType;
  logger: Logger;
  fetch: typeof fetch;
  generateResultLogName: () => string;
}
