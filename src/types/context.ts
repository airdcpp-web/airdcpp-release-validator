import { ServerInfo } from 'airdcpp-extension';
import { Validator } from './internal';
import { APIType } from 'api';
import { Logger } from 'airdcpp-apisocket';
import { AxiosInstance } from 'axios';


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
}
export interface Context {
  configGetter: ConfigGetter;
  extensionName: string;
  application: ApplicationInfo;
  api: APIType;
  logger: Logger;
  axios: AxiosInstance;
  generateResultLogName: () => string;
}
