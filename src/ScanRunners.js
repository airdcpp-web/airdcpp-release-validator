import Scanner from './Scanner';


// Scan initiators
const ScanRunners = function (socket, extensionName, validatorsGetter) {
	const reduceGroupedPath = (reduced, info) => {
		reduced.push(...info.paths);
		return reduced;
	};

	const postEvent = (message, severity) => {
		socket.post('events', {
			text: `[${extensionName}] ${message}`,
			severity,
		});
	};

	const errorLogger = message => {
		// TODO: add file logger support
		postEvent(message, 'warning');
	};

	const onShareScanCompleted = (scanner) => {
		let text;
		if (scanner.errors.count()) {
			text = `Scan completed and the following problems were found: ${scanner.errors.format()}`;
		} else {
			text = 'Scan completed, no problems were found';
		}

		socket.logger.info(`Share scan completed: ${scanner.stats.scanned} paths scanned with maximum concurrency of ${scanner.stats.maxRunning}`);
		postEvent(text, scanner.errors.count() ? 'warning' : 'info');
	};

	// Scan entire share
	const scanShare = async () => {
		const directories = await socket.get('share/grouped_root_paths');

		postEvent('Scanning shared releases...', 'info');

		const scanner = Scanner(validatorsGetter(), errorLogger);
		await scanner.scanPaths(directories.reduce(reduceGroupedPath, []));

		onShareScanCompleted(scanner);
		
		return scanner;
	};

	// Scan a finished bundle
	const onBundleFinished = async (bundle, accept, reject) => {
		if (bundle.type.id === 'file') {
			accept();
			return null;
		}

		// Scan it
		const scanner = Scanner(validatorsGetter(), errorLogger);
		await scanner.scanPath(bundle.target);

		socket.logger.info(`Bundle scan completed: ${scanner.stats.scanned} paths were scanned`);
		if (scanner.errors.count()) {
			// Failed, report and reject
			const error = scanner.errors.pickOne();

			postEvent(
				`Following problems were found while scanning the bundle ${bundle.name}: ${scanner.errors.format()}`, 
				'error'
			);

			reject(error.id, error.message);
		} else {
			accept();
		}

		return scanner;
	};

	const stop = () => {
		// TODO
	};

	return {
		scanShare,
		onBundleFinished,
		stop,
	};
};

export default ScanRunners;