import ScanRunners from 'ScanRunners';

import path from 'path';

import { getMockContext, getMockApi, MockContextOptions } from './mock-context';
import { ScannerType } from 'Scanner';
import { APIType } from 'api';



describe('Scan runner', () => {
  const getScanRunners = (api: APIType, options?: Partial<MockContextOptions>) => {
    const context = getMockContext(api, options);
    return ScanRunners(context);
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
    
    const api = getMockApi();

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(api);
    const scanner = await runner.onBundleFinished(bundle, accept, reject) as any as ScannerType;

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
    
    const api = getMockApi();

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(api);

    const onShareDirectoryAdded = runner.getShareDirectoryAddedHandler(false);
    const scanner = await onShareDirectoryAdded(
      hookData,
      accept,
      reject
    ) as any as ScannerType;

    expect(reject.mock.calls.length).toBe(1);
    /*expect(reject.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "extra_files",
        "Following problems were found while scanning the share directory C:\\\\Projects\\\\airdcpp-release-validator\\\\tests\\\\data\\\\Test.Release-TEST: extra files in release directory (count: 1)",
      ]
    `);*/

    expect(accept.mock.calls.length).toBe(0);
    expect(scanner.stats.scannedDirectories).toBe(1); // Not recursive
  });

  test('should ignore excluded files/directories', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const ignoredPathFn = jest.fn();

    const api = getMockApi({
      validateSharePath: (validatedPath, skipCheckQueue) => {
        if (
          validatedPath.endsWith('Sample' + path.sep) ||
          validatedPath.endsWith('forbidden_extra.zip')
        ) {
          ignoredPathFn(path, skipCheckQueue);
          return Promise.reject('Ignored');
        }

        return Promise.resolve();
      },
    });

    const hookData = {
      path: scanPath,
      new_parent: false,
    };

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(api, {
      configOverrides: {
        ignoreExcluded: true,
      }
    });
    const onShareDirectoryAdded = runner.getShareDirectoryAddedHandler(false);
    const scanner = await onShareDirectoryAdded(
      hookData,
      accept,
      reject
    ) as any as ScannerType;

    expect(reject.mock.calls.length).toBe(0);
    expect(accept.mock.calls.length).toBe(1);
    expect(ignoredPathFn.mock.calls.length).toBe(2);
    expect(scanner.stats.scannedDirectories).toBe(1);
  });

  test('should not proceed if all files in the directory are excluded', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const ignoredPathFn = jest.fn();

    const api = getMockApi({
      validateSharePath: (validatedPath, skipCheckQueue) => {
        ignoredPathFn(validatedPath, skipCheckQueue);
        return Promise.reject('Ignored');
      },
    });

    const hookData = {
      path: scanPath,
      new_parent: false,
    };

    const reject = jest.fn();
    const accept = jest.fn();

    const runner = getScanRunners(api, {
      configOverrides: {
        ignoreExcluded: true,
      }
    });
    const onShareDirectoryAdded = runner.getShareDirectoryAddedHandler(false);
    const scanner = await onShareDirectoryAdded(
      hookData,
      accept,
      reject
    ) as any as ScannerType;

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

    const api = getMockApi({
      getShareRoot: () => {
        return Promise.resolve(shareRootInfo);
      },
    });

    const runner = getScanRunners(api);
    const scanner = await runner.scanShareRoots([ 'CWXQGJYK3QERDRGB25M4ABJMGF2F4ODDDOON25A' ]);

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

    const api = getMockApi({
      getGroupedShareRoots: () => {
        return Promise.resolve(sharePaths);
      },
    });

    const runner = getScanRunners(api);
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

    const api = getMockApi({
      getGroupedShareRoots: () => {
        return Promise.resolve(sharePaths);
      },
    });

    const runner = getScanRunners(api as APIType);
    const scanner = await runner.scanShare();

    expect(scanner.errors.count() > 0).toBe(true);
    expect(scanner.errors.format().indexOf('ENOENT')).not.toBe(-1);
  });
});
