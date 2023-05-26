import ScanRunners from 'ScanRunners';

import path from 'path';

import {
  getMockContext,
  getMockApi,
  MockContextOptions,
  MOCK_RESULT_LOG_NAME,
} from './mock-context';
import { ScannerType } from 'Scanner';
import { APIType } from 'api';
import { sanitizeResultPaths } from './helpers';
import { FilelistItem } from 'types';
import { Headers } from 'node-fetch';

describe('Scan runner', () => {
  const getScanRunners = (
    api: APIType,
    options?: Partial<MockContextOptions>
  ) => {
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
    const scanner = (await runner.onBundleFinished(
      bundle,
      accept,
      reject
    )) as any as ScannerType;

    expect(reject.mock.calls.length).toBe(1);
    expect(reject.mock.calls[0]).toMatchInlineSnapshot(`
      [
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
    const scanner = (await onShareDirectoryAdded(
      hookData,
      accept,
      reject
    )) as any as ScannerType;

    expect(reject.mock.calls.length).toBe(1);
    expect(reject.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "extra_items",
        "Extra files in release directory (1 file(s): forbidden_extra.zip)",
      ]
    `);

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
      },
    });
    const onShareDirectoryAdded = runner.getShareDirectoryAddedHandler(false);
    const scanner = (await onShareDirectoryAdded(
      hookData,
      accept,
      reject
    )) as any as ScannerType;

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
      },
    });
    const onShareDirectoryAdded = runner.getShareDirectoryAddedHandler(false);
    const scanner = (await onShareDirectoryAdded(
      hookData,
      accept,
      reject
    )) as any as ScannerType;

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
    const scanner = await runner.scanShareRoots([
      'CWXQGJYK3QERDRGB25M4ABJMGF2F4ODDDOON25A',
    ]);

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

  test('should scan filelist directories', async () => {
    const scanPath = path.join(__dirname, 'data/Test.Release-TEST');

    const filelistItemInfo: FilelistItem = {
      id: 1,
      path: '/Share/Test.Release-TEST/',
      type: {
        id: 'directory',
      },
      dupe: {
        id: 'share full',
        paths: [scanPath],
      },
    };

    const api = getMockApi({
      getFilelistItem: () => {
        return Promise.resolve(filelistItemInfo);
      },
    });

    const runner = getScanRunners(api);
    const scanner = await runner.scanOwnFilelistDirectories(
      [1],
      'CWXQGJYK3QERDRGB25M4ABJMGF2F4ODDDOON25A'
    );

    expect(scanner.errors.count() > 0).toBe(true);
    expect(scanner.stats.scannedDirectories).toBe(2);
  });

  test('should handle separate log files', async () => {
    const sharePaths = [
      {
        name: 'VNAME',
        paths: [path.join(__dirname, 'data/Test.Release-TEST')],
      },
    ];

    const postTempShareFn = jest.fn();
    const deleteTempShareFn = jest.fn();
    const createViewFileFn = jest.fn();
    const uploadContentFn = jest.fn();

    const MOCK_UPLOAD_LOCATION_ID = 'MOCK_UPLOAD_ID';
    const MOCK_VIEW_FILE_ID = 1;
    const MOCK_TTH = 'mock_tth';

    const api = getMockApi({
      getGroupedShareRoots: () => {
        return Promise.resolve(sharePaths);
      },
      deleteTempShare: (id) => {
        deleteTempShareFn(id);
        return Promise.resolve();
      },
      postTempShare: (tempFileId, name) => {
        postTempShareFn(tempFileId, name);
        return Promise.resolve({
          item: {
            tth: MOCK_TTH,
            id: MOCK_VIEW_FILE_ID,
          },
        });
      },
      createViewFile: (tth) => {
        createViewFileFn(tth);
        return Promise.resolve();
      },
    });

    const runner = getScanRunners(api as APIType, {
      fetch: (url, options) => {
        uploadContentFn(url, options);

        const headers = new Headers({
          location: MOCK_UPLOAD_LOCATION_ID,
        });

        return Promise.resolve({
          headers,
        });
      },
      configOverrides: {
        separateLogFile: true,
      },
    });

    await runner.scanShare();

    expect(postTempShareFn).toHaveBeenCalledWith(
      MOCK_UPLOAD_LOCATION_ID,
      MOCK_RESULT_LOG_NAME
    );
    expect(deleteTempShareFn).toHaveBeenCalledWith(MOCK_VIEW_FILE_ID);
    expect(createViewFileFn).toHaveBeenCalledWith(MOCK_TTH);

    const fetchCall = uploadContentFn.mock.calls[0];

    const callUrl = fetchCall[0];
    const callOptions = fetchCall[1];

    const sanitizedCallOptions = {
      ...callOptions,
      body: sanitizeResultPaths(callOptions.body), // Remove absolute paths
    };

    expect(callUrl).toMatchInlineSnapshot(`"http://mock_url/temp"`);
    expect(sanitizedCallOptions).toMatchInlineSnapshot(`
      {
        "body": "/TESTS_ROOT/data/Test.Release-TEST: Extra files in release directory (1 file(s): forbidden_extra.zip)
      /TESTS_ROOT/data/Test.Release-TEST/Sample/: NFO/SFV found but there are no other files in the folder
      /TESTS_ROOT/data/Test.Release-TEST/Sample/: No valid lines were parsed from the SFV file (1 file(s): invalid.sfv)",
        "headers": {
          "Authorization": "mock-token-type mock-token",
        },
        "method": "POST",
      }
    `);
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
