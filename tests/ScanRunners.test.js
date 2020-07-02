import ScanRunners from 'ScanRunners';
import path from 'path';

import validators from 'validators';

describe('Scan runner', () => {
	const logger = {
		verbose: _ => {},
		info: _ => {},
		warn: _ => {},
		error: _ => {},
	}

	test('should reject invalid bundles', async () => {
		const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

		const bundle = {
			name: 'Test.Release-TEST',
			target: scanPath,
			type: {
				id: 'directory',
			},
		};

		const socket = {
			post: _ => {},
			logger,
		};

		const reject = jest.fn();
		const accept = jest.fn();

		const runner = ScanRunners(socket, 'test-extension', _ => validators);
		await runner.onBundleFinished(bundle, accept, reject);

		expect(reject.mock.calls.length).toBe(1);
		expect(accept.mock.calls.length).toBe(0);
	});

	test('should reject invalid new share directories', async () => {
		const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

		const hookData = {
			path: scanPath,
			new_parent: false,
		};

		const socket = {
			post: _ => {},
			logger,
		};

		const reject = jest.fn();
		const accept = jest.fn();

		const runner = ScanRunners(socket, 'test-extension', _ => validators);
		await runner.onShareDirectoryAdded(hookData, accept, reject);

		expect(reject.mock.calls.length).toBe(1);
		expect(accept.mock.calls.length).toBe(0);
	});

	test('should scan share roots', async () => {
		const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

		const shareRootInfo = {
			id: 1,
			path: scanPath,
		};

		const socket = {
			post: _ => {},
			get: _ => Promise.resolve(shareRootInfo),
			logger,
		};

		const runner = ScanRunners(socket, 'test-extension', _ => validators);
		const scanner = await runner.scanShareRoots([ 1 ]);

		expect(scanner.errors.count() > 0).toBe(true);
	});

	test('should perform share scan', async () => {
		const sharePaths = [
			{
				name: 'VNAME',
				paths: [ path.join(__dirname, 'data/Test.Release-TEST') ],
			}
		];

		const socket = {
			post: _ => {},
			get: _ => Promise.resolve(sharePaths),
			logger,
		};

		const runner = ScanRunners(socket, 'test-extension', _ => validators);
		const scanner = await runner.scanShare();

		expect(scanner.errors.count() > 0).toBe(true);
	});

	test('should report disk access errors', async () => {
		const sharePaths = [
			{
				name: 'VNAME',
				paths: [ path.join(__dirname, 'nonexistingdirectory') ],
			}
		];

		const socket = {
			post: _ => {},
			get: _ => Promise.resolve(sharePaths),
			logger,
		};

		const runner = ScanRunners(socket, 'test-extension', _ => validators);
		const scanner = await runner.scanShare();

		expect(scanner.errors.count() > 0).toBe(true);
		expect(scanner.errors.format().indexOf('ENOENT')).not.toBe(-1);
	});
});