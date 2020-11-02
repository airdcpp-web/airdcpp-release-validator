import ScanRunners from 'ScanRunners';
import path from 'path';

import validators from 'validators';

import { MockLogger as logger } from './helpers';

describe('Scan runner', () => {
  const getScanRunners = (socket, ignoreExcluded = false) => {
    return ScanRunners(socket, 'test-extension', () => ({
      validators,
      ignoreExcluded,
    }));
  };

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
      post: (_) => {},
      logger,
    };

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(socket);
    const scanner = await runner.onBundleFinished(bundle, accept, reject);

    expect(reject.mock.calls.length).toBe(1);
    expect(reject.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "invalid_content",
        "Extra files in release directory",
      ]
    `);
    expect(accept.mock.calls.length).toBe(0);
    expect(scanner.stats.scannedDirectories).toBe(2);
  });

  test('should reject invalid new share directories', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const hookData = {
      path: scanPath,
      new_parent: false,
    };

    const socket = {
      post: (_) => {},
      logger,
    };

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(socket);
    const scanner = await runner.onShareDirectoryAdded(
      false,
      hookData,
      accept,
      reject
    );

    expect(reject.mock.calls.length).toBe(1);
    expect(reject.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "extra_files",
        "Following problems were found while scanning the share directory C:\\\\Projects\\\\airdcpp-release-validator\\\\tests\\\\data\\\\Test.Release-TEST: extra files in release directory (count: 1)",
      ]
    `);

    expect(accept.mock.calls.length).toBe(0);
    expect(scanner.stats.scannedDirectories).toBe(1); // Not recursive
  });

  test('should ignore excluded files/directories', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const ignoredPathFn = jest.fn();
    const socket = {
      post: (url, data) => {
        // Events
        if (url.startsWith('events')) {
          return {};
        }

        if (url.startsWith('share')) {
          // Share validator
          if (
            data.path.endsWith('Sample' + path.sep) ||
            data.path.endsWith('forbidden_extra.zip')
          ) {
            ignoredPathFn(url, data);
            throw Error('Ignored');
          }
        }

        return {};
      },
      logger,
    };

    const hookData = {
      path: scanPath,
      new_parent: false,
    };

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(socket, true);
    const scanner = await runner.onShareDirectoryAdded(
      false,
      hookData,
      accept,
      reject
    );

    expect(reject.mock.calls.length).toBe(0);
    expect(accept.mock.calls.length).toBe(1);
    expect(ignoredPathFn.mock.calls.length).toBe(2);
    expect(scanner.stats.scannedDirectories).toBe(1);
  });

  test('should not proceed if all files in the directory are excluded', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const ignoredPathFn = jest.fn();
    const socket = {
      post: (url, data) => {
        // Events
        if (url.startsWith('events')) {
          return {};
        }

        if (url.startsWith('share')) {
          // Share validator, fail all
          ignoredPathFn(url, data);
          throw Error('Ignored');
        }

        return {};
      },
      logger,
    };

    const hookData = {
      path: scanPath,
      new_parent: false,
    };

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(socket, true);
    const scanner = await runner.onShareDirectoryAdded(
      false,
      hookData,
      accept,
      reject
    );

    expect(reject.mock.calls.length).toBe(0);
    expect(accept.mock.calls.length).toBe(1);
    expect(ignoredPathFn.mock.calls.length).toBe(6);
    expect(scanner.stats.scannedDirectories).toBe(0);
  });

  test('should scan share roots', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const shareRootInfo = {
      id: 1,
      path: scanPath,
    };

    const socket = {
      post: () => {},
      get: () => Promise.resolve(shareRootInfo),
      logger,
    };

    const runner = getScanRunners(socket);
    const scanner = await runner.scanShareRoots([1]);

    expect(scanner.errors.count() > 0).toBe(true);
    expect(scanner.stats.scannedDirectories).toBe(2);
  });

  test('should perform share scan', async () => {
    const sharePaths = [
      {
        name: 'VNAME',
        paths: [path.join(__dirname, 'data/Test.Release-TEST')],
      },
    ];

    const socket = {
      post: () => {},
      get: () => Promise.resolve(sharePaths),
      logger,
    };

    const runner = getScanRunners(socket);
    const scanner = await runner.scanShare();

    expect(scanner.errors.count() > 0).toBe(true);
  });

  test('should report disk access errors', async () => {
    const sharePaths = [
      {
        name: 'VNAME',
        paths: [path.join(__dirname, 'nonexistingdirectory')],
      },
    ];

    const socket = {
      post: () => {},
      get: () => Promise.resolve(sharePaths),
      logger,
    };

    const runner = getScanRunners(socket);
    const scanner = await runner.scanShare();

    expect(scanner.errors.count() > 0).toBe(true);
    expect(scanner.errors.format().indexOf('ENOENT')).not.toBe(-1);
  });
});
