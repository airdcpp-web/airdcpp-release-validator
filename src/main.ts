'use strict';

const CONFIG_VERSION = 1;


import axios from 'axios';

import { addContextMenuItems, APISocket } from 'airdcpp-apisocket';
import { ExtensionEntryData } from 'airdcpp-extension';
//@ts-ignore
import SettingsManager from 'airdcpp-extension-settings';

import { API } from 'api';

import ScanRunners from './ScanRunners';
import { ChatCommandData, Context, SessionInfo } from './types';
import validators from './validators';
import { getSettingDefinitions } from 'settings';


const SCAN_ACCESS = 'settings_edit';

const hasScanAccess = (permissions: string[]) => {
  return permissions.indexOf('admin') !== -1 || permissions.indexOf(SCAN_ACCESS) !== -1;
};

export default function (socket: APISocket, extension: ExtensionEntryData) {
  let runners: ReturnType<typeof ScanRunners>;

  // EXTENSION LIFECYCLE
  extension.onStart = async (sessionInfo: SessionInfo) => {
    // INITIALIZATION
    const settings = SettingsManager(socket, {
      extensionName: extension.name, 
      configFile: extension.configPath + 'config.json',
      configVersion: CONFIG_VERSION,
      definitions: [ 
        ...validators.map(validator => validator.setting),
        ...getSettingDefinitions(sessionInfo),
      ],
    });

    const validatorEnabled = ({ setting }: any) => {
      return !setting || settings.getValue(setting.key);
    };

    await settings.load();

    const api = API(socket);
    const context: Context = {
      api,
      axios,
      logger: socket.logger,
      extensionName: extension.name,
      generateResultLogName: () => `Share scan ${new Date().toLocaleString()}`,
      configGetter: () => ({
        ignoreExcluded: settings.getValue('ignore_excluded'),
        separateLogFile: settings.getValue('separate_log_file'),
        validators: validators.filter(validatorEnabled),
      }),
      application: {
        server: extension.server,
        session: {
          token: sessionInfo.auth_token,
          tokenType: sessionInfo.token_type,
        },
      }
    };

    runners = ScanRunners(context);

    // CHAT COMMANDS
    const checkChatCommand = (data: ChatCommandData) => {
      const { command, args, permissions } = data;
      if (!hasScanAccess(permissions)) {
        return null;
      }
  
      switch (command) {
        case 'help': {
          return `

  Release validator commands

  /rvalidator scan - Scan the entire share for invalid content

          `;
        }
        case 'rvalidator': {
          if (!!args.length) {
            switch (args[0]) {
              case 'scan': {
                runners.scanShare();
                break;
              }
            }
          }
        }
      }
  
      return null;
    };
  
    const onChatCommand = (type: 'hub' | 'private_chat', data: ChatCommandData, entityId: string | number) => {
      const statusMessage = checkChatCommand(data);
      if (statusMessage) {
        socket.post(`${type}/${entityId}/status_message`, {
          text: statusMessage,
          severity: 'info',
        });
      }
    };

    const subscriberInfo = {
      id: extension.name,
      name: 'Release validator',
    };

    if (settings.getValue('scan_finished_bundles')) {
      await socket.addHook('queue', 'queue_bundle_finished_hook', runners.onBundleFinished, subscriberInfo);
    }
    
    if (settings.getValue('scan_new_share_directories')) {
      // Starting from feature level 5, the application will handle error reporting
      const postEventLog = sessionInfo.system_info.api_feature_level <= 4;
      const onShareDirectoryAdded = runners.getShareDirectoryAddedHandler(postEventLog);
      await socket.addHook('share', 'new_share_directory_validation_hook', onShareDirectoryAdded, subscriberInfo);
    }
    
    await socket.addListener('hubs', 'hub_text_command', onChatCommand.bind(null, 'hubs'));
    await socket.addListener('private_chat', 'private_chat_text_command', onChatCommand.bind(null, 'private_chat'));

    addContextMenuItems(
      socket,
      [
        {
          id: 'scan_missing_extra',
          title: `Scan for missing/extra files`,
          icon: {
            semantic: 'yellow broom'
          },
          access: SCAN_ACCESS,
          onClick: runners.scanShareRoots,
        }
      ],
      'share_root',
      subscriberInfo,
    );
    
    addContextMenuItems(
      socket,
      [
        {
          id: 'scan_missing_extra',
          title: `Scan share for missing/extra files`,
          icon: {
            semantic: 'yellow broom'
          },
          access: SCAN_ACCESS,
          onClick: async () => {
            await runners.scanShare();
          },
          filter: ids => ids.indexOf(extension.name) !== -1
        }
      ],
      'extension',
      subscriberInfo,
    );
  };

  extension.onStop = () => {
    // Stop possible running scans
    if (runners) {
      runners.stop();
    }
  };
};