// import { APISocket } from 'airdcpp-apisocket';
import { ServerInfo } from 'airdcpp-extension';
import { Validator } from './internal';
import { APIType } from 'api';
import { Logger } from 'airdcpp-apisocket';
import { AxiosInstance } from 'axios';


// CONTEXT
export interface Config {
  ignoreExcluded: boolean;
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
  // socket: APISocket;
  configGetter: ConfigGetter;
  extensionName: string;
  application: ApplicationInfo;
  api: APIType;
  logger: Logger;
  axios: AxiosInstance;
}
