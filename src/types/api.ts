// API
export interface ChatCommandData {
  command: string;
  args: string[];
  permissions: string[];
}


export enum PlatformEnum {
  WINDOWS = 'win32',
  MAC = 'darwin',
  LINUX = 'linux',
  FREEBSD = 'freebsd',
  OTHER = 'other',
}

export interface SessionInfo {
  system_info: {
    // path_separator: string;
    cid: string;
    api_feature_level: number;
    platform: PlatformEnum;
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

export interface PostTempShareResponse {
  item: {
    id: number;
    tth: string;
  }
}
