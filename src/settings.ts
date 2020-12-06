import { PlatformEnum, SessionInfo } from 'types';


export const hasSeparateLogFileSupport = (sessionInfo: SessionInfo) => {
  return sessionInfo.system_info.api_feature_level >= 6;
};

export const getSettingDefinitions = (sessionInfo: SessionInfo) => {
  const SettingDefinitions = [
    {
      key: 'scan_finished_bundles',
      title: 'Scan finished bundles',
      default_value: true,
      type: 'boolean'
    }, {
      key: 'scan_new_share_directories',
      title: 'Scan new share directories',
      default_value: true,
      type: 'boolean'
    }, {
      key: 'ignore_excluded',
      title: 'Ignore files/directories that are excluded from share',
      // Enable by default on Windows to avoid issue for migrating users because of hidden files/other ignores
      // Non-windows may also run the application on slower devices, that would increase the scan time even more
      default_value: sessionInfo.system_info.platform === PlatformEnum.WINDOWS ? true : false,
      type: 'boolean'
    },
  ];

  if (hasSeparateLogFileSupport(sessionInfo)) {
    // Older feature levels don't allow adding temp share items without a hub URL
    SettingDefinitions.push({
      key: 'separate_log_file',
      title: 'Open manual scan results in a separate file',
      default_value: false,
      type: 'boolean'
    });
  }

  return SettingDefinitions;
};