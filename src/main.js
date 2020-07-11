'use strict';

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
	}
];

const CONFIG_VERSION = 1;

import { addContextMenuItems } from 'airdcpp-apisocket';
import SettingsManager from 'airdcpp-extension-settings';
import ScanRunners from './ScanRunners';
import validators from './validators';

const SCAN_ACCESS = 'settings_edit';

const hasScanAccess = (permissions) => {
	return permissions.indexOf('admin') !== -1 || permissions.indexOf(SCAN_ACCESS) !== -1;
};

export default function (socket, extension) {
	// INITIALIZATION
	const settings = SettingsManager(socket, {
		extensionName: extension.name, 
		configFile: extension.configPath + 'config.json',
		configVersion: CONFIG_VERSION,
		definitions: [ 
			...validators.map(validator => validator.setting),
			...SettingDefinitions,
		],
	});

	const validatorEnabled = ({ setting }) => {
		return !setting || settings.getValue(setting.key);
	};

	const runners = ScanRunners(socket, extension.name, _ => validators.filter(validatorEnabled));


	// CHAT COMMANDS
	const checkChatCommand = (data) => {
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

	const onChatCommand = (type, data, entityId) => {
		const statusMessage = checkChatCommand(data);
		if (statusMessage) {
			socket.post(`${type}/${entityId}/status_message`, {
				text: statusMessage,
				severity: 'info',
			});
		}
	};

	// EXTENSION LIFECYCLE
	extension.onStart = async (sessionInfo) => {
		await settings.load();

		const subscriberInfo = {
			id: extension.name,
			name: 'Release validator',
		};

		if (settings.getValue('scan_finished_bundles')) {
			socket.addHook('queue', 'queue_bundle_finished_hook', runners.onBundleFinished, subscriberInfo);
		}
		
		if (settings.getValue('scan_new_share_directories')) {
			socket.addHook('share', 'new_share_directory_validation_hook', runners.onShareDirectoryAdded, subscriberInfo);
		}
		
		socket.addListener('hubs', 'hub_text_command', onChatCommand.bind(this, 'hubs'));
		socket.addListener('private_chat', 'private_chat_text_command', onChatCommand.bind(this, 'private_chat'));

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
		runners.stop();
	};
};