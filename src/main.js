'use strict';

const SettingDefinitions = [
	{
		key: 'scan_finished_bundles',
		title: 'Scan finished bundles',
		default_value: true,
		type: 'boolean'
	}
];

const CONFIG_VERSION = 1;

import SettingsManager from 'airdcpp-extension-settings';
import ScanRunners from './ScanRunners';
import validators from './validators';

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
	const checkChatCommand = (text) => {
		if (text.length === 0 || text[0] !== '/') {
			return null;
		}

		if (text.indexOf('/help') === 0) {
			return `

	Release validator commands

	/rvalidator scan - Scan the entire share for invalid content

			`;
		} else if (text.indexOf('/rvalidator scan') === 0) {
			runners.scanShare();
		}

		return null;
	};

	const onOutgoingHubMessage = (message, accept, reject) => {
		const statusMessage = checkChatCommand(message.text);
		if (statusMessage) {
			socket.post('hubs/status_message', {
				hub_urls: [ message.hub_url ],
				text: statusMessage,
				severity: 'info',
			});
		}

		accept();
	};

	const onOutgoingPrivateMessage = (message, accept, reject) => {
		const statusMessage = checkChatCommand(message.text);
		if (statusMessage) {
			socket.post(`private_chat/${message.user.cid}/status_message`, {
				text: statusMessage,
				severity: 'info',
			});
		}

		accept();
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

		socket.addHook('hubs', 'hub_outgoing_message_hook', onOutgoingHubMessage, subscriberInfo);
		socket.addHook('private_chat', 'private_chat_outgoing_message_hook', onOutgoingPrivateMessage, subscriberInfo);
	};

	extension.onStop = () => {
		// Stop possible running scans
		runners.stop();
	};
};