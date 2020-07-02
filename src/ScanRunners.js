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

	const onScanCompleted = (scanner) => {
		let text;
		if (scanner.errors.count()) {
			text = `Scan completed and the following problems were found: ${scanner.errors.format()}`;
		} else {
			text = 'Scan completed, no problems were found';
		}

		socket.logger.info(`Scan completed: ${scanner.stats.scanned} paths scanned with maximum concurrency of ${scanner.stats.maxRunning}`);
		postEvent(text, scanner.errors.count() ? 'warning' : 'info');
	};

	// Scan selected paths
	const scanPaths = async (paths) => {
		const text = paths.length === 1 ? `Scanning the path ${paths[0]}...` : `Scanning ${paths.length} paths...`;
		postEvent(text, 'info');

		const scanner = Scanner(validatorsGetter(), errorLogger);
		await scanner.scanPaths(paths);
		onScanCompleted(scanner);
		
		return scanner;
	};

	// Scan entire share
	const scanShare = async () => {
		const directories = await socket.get('share/grouped_root_paths');

		postEvent('Scanning shared releases...', 'info');
		const scanner = Scanner(validatorsGetter(), errorLogger);
		await scanner.scanPaths(directories.reduce(reduceGroupedPath, []));
		onScanCompleted(scanner);

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

	// Scan new share directories
	const onShareDirectoryAdded = async ({ path, new_parent }, accept, reject) => {
		// Scan it
		const scanner = Scanner(validatorsGetter(), errorLogger);
		await scanner.scanPath(path, false);

		socket.logger.info(`Share directory scan completed: ${scanner.stats.scanned} paths were scanned`);
		if (scanner.errors.count()) {
			// Failed, report and reject
			const error = scanner.errors.pickOne();

			postEvent(
				`Following problems were found while scanning the share directory ${path}: ${scanner.errors.format()}`, 
				'error'
			);

			reject(error.id, error.message);
		} else {
			accept();
		}

		return scanner;
	};

	const scanShareRoots = async (ids) => {
		const paths = [];
		for (const id of ids) {
			try {
				const shareRoot = await socket.get(`share_roots/${id}`);
				paths.push(shareRoot.path);
			} catch (e) {
				socket.logger.info(`Failed to fetch share root information: ${e} (id ${id})`);
			}
		}

		return await scanPaths(paths);
	};

	const stop = () => {
		// TODO
	};

	return {
		scanShare,
		scanPaths,
		scanShareRoots,
		onBundleFinished,
		onShareDirectoryAdded,
		stop,
	};
};

export default ScanRunners;