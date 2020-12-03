import Scanner, { ScannerType } from './Scanner';

import { HookCallback } from 'airdcpp-apisocket';
import { Bundle, GroupedPath, SharePathHookData, SeverityEnum, Context } from './types';
import { getApiErrorLogger, getMemoryErrorLogger } from 'errors/ErrorLogger';
// import { openLog } from 'helpers/LogViewer';


// Scan initiators
const ScanRunners = function (context: Context) {
  const { api, logger, configGetter } = context;
  const reduceGroupedPath = (reduced: string[], info: GroupedPath) => {
    reduced.push(...info.paths);
    return reduced;
  };

  // Log extension info (debug) message after the scan was completed
  const logCompletedDebug = (scanner: ScannerType, message: string) => {
    let text = message;
    text += `: scanned ${scanner.stats.scannedDirectories} directories and ${scanner.stats.scannedFiles} files, took ${scanner.stats.duration} ms`;
    text += ` (${(scanner.stats.duration / scanner.stats.scannedDirectories).toFixed(2)} ms per directory, ${(scanner.stats.duration / scanner.stats.scannedFiles).toFixed(2)} ms per file)`;
    if (scanner.stats.ignoredFiles > 0 || scanner.stats.ignoredDirectories > 0) {
      text += `, ignored ${scanner.stats.ignoredDirectories} directories and ${scanner.stats.ignoredFiles} files`;
    }

    logger.info(text);
  };

  const pathValidator = (skipQueueCheck: boolean) => {
    if (!configGetter().ignoreExcluded) {
      return () => true;
    }

    const validate = async (path: string) => {
      try {
        await api.validateSharePath(path, skipQueueCheck);
      } catch (e) {
        logger.verbose(`Path ${path} is ignored from share (${e.message})`);
        return false;
      }

      return true;
    };

    return validate;
  };

  const ApiErrorLogger = getApiErrorLogger(api.postEvent);

  const onManualScanCompleted = (scanner: ReturnType<typeof Scanner>) => {
    let text;
    if (scanner.errors.count()) {
      text = `Scan completed and the following problems were found: ${scanner.errors.format()}`;
    } else {
      text = 'Scan completed, no problems were found';
    }

    logCompletedDebug(scanner, `Manual scan completed with maximum concurrency of ${scanner.stats.maxRunning}`);
    api.postEvent(text, scanner.errors.count() ? SeverityEnum.WARNING : SeverityEnum.INFO);
  };

  const doManualScan = async (paths: string[]) => {

    // const logger = getMemoryErrorLogger(true);

    const logger = ApiErrorLogger;
    const scanner = Scanner(configGetter().validators, logger, pathValidator(false));

    await scanner.scanPaths(paths);

    /*try {
      await openLog(logger.getLog(), context);
    } catch (e) {
      postEvent(`Failed to open scan results: ${e.message}`, SeverityEnum.ERROR);
    }*/

    onManualScanCompleted(scanner);
    return scanner;
  };

  // Scan selected paths
  const scanPathsManual = async (paths: string[]) => {
    const text = paths.length === 1 ? `Scanning the path ${paths[0]}...` : `Scanning ${paths.length} paths...`;
    api.postEvent(text, SeverityEnum.INFO);

    const scanner = doManualScan(paths);
    return scanner;
  };

  // Scan entire share
  const scanShare = async () => {
    // const groupedDirectories = await socket.get<GroupedPath[]>('share/grouped_root_paths');
    const groupedDirectories = await api.getGroupedShareRoots();
    api.postEvent('Scanning shared releases...', SeverityEnum.INFO);

    const scanner = await doManualScan(groupedDirectories.reduce(reduceGroupedPath, []));
    return scanner;
  };

  // Scan a finished bundle
  const onBundleFinished: HookCallback<Bundle> = async (bundle, accept, reject) => {
    if (bundle.type.id === 'file') {
      accept(undefined);
      return null;
    }

    // Scan it
    const scanner = Scanner(configGetter().validators, ApiErrorLogger, pathValidator(true));
    await scanner.scanPath(bundle.target);

    logCompletedDebug(scanner, 'Bundle scan completed');
    if (scanner.errors.count()) {
      // Failed, report and reject
      const error = scanner.errors.pickOne();

      api.postEvent(
        `Following problems were found while scanning the bundle ${bundle.name}: ${scanner.errors.format()}`, 
        SeverityEnum.ERROR
      );

      reject(error.id, error.message);
    } else {
      accept(undefined);
    }

    return scanner;
  };

  // Scan new share directories
  const getShareDirectoryAddedHandler = (postEventApi: boolean) => {
    const onShareDirectoryAdded: HookCallback<SharePathHookData> = async ({ path, new_parent }, accept, reject) => {
      // Scan it
      const errorLogger = getMemoryErrorLogger(false);

      const scanner = Scanner(configGetter().validators, errorLogger.logger, pathValidator(false));
      await scanner.scanPath(path, false);

      logCompletedDebug(scanner, 'New share directory scan completed');
      if (scanner.errors.count()) {
        // Failed, report and reject
        if (postEventApi) {
          const errorMessage = `Following problems were found while scanning the share directory ${path}: ${scanner.errors.format()}`;
          api.postEvent(
            errorMessage, 
            SeverityEnum.ERROR
          );
        }

        const error = scanner.errors.pickOne();
        reject(error.id, errorLogger.getLog());
      } else {
        accept(undefined);
      }

      return scanner;
    };

    return onShareDirectoryAdded;
  };

  const scanShareRoots = async (ids: string[]) => {
    const paths = [];
    for (const id of ids) {
      try {
        const shareRoot = await api.getShareRoot(id);
        paths.push(shareRoot.path);
      } catch (e) {
        logger.info(`Failed to fetch share root information: ${e} (id ${id})`);
      }
    }

    return await scanPathsManual(paths);
  };

  const stop = () => {
    // TODO
  };

  return {
    // Manual scans
    scanShare,
    scanShareRoots,

    // Hooks
    onBundleFinished,
    getShareDirectoryAddedHandler,

    stop,
  };
};

export default ScanRunners;