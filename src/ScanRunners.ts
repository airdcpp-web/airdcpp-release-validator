import Scanner from './Scanner';

import { HookCallback } from 'airdcpp-apisocket';
import { Bundle, GroupedPath, SharePathHookData, ShareRoot, SeverityEnum, Context } from './types';
import { getApiErrorLogger, MemoryErrorLogger } from 'errors/ErrorLogger';


// Scan initiators
const ScanRunners = function ({ socket, extensionName, configGetter }: Context) {
  const reduceGroupedPath = (reduced: string[], info: GroupedPath) => {
    reduced.push(...info.paths);
    return reduced;
  };

  const postEvent = (message: string, severity: SeverityEnum) => {
    socket.post('events', {
      text: `[${extensionName}] ${message}`,
      severity,
    });
  };

  // Log extension info (debug) message after the scan was completed
  const logCompletedDebug = (scanner: ReturnType<typeof Scanner>, message: string) => {
    let text = message;
    text += `: scanned ${scanner.stats.scannedDirectories} directories and ${scanner.stats.scannedFiles} files, took ${scanner.stats.duration} ms`;
    text += ` (${(scanner.stats.duration / scanner.stats.scannedDirectories).toFixed(2)} ms per directory, ${(scanner.stats.duration / scanner.stats.scannedFiles).toFixed(2)} ms per file)`;
    if (scanner.stats.ignoredFiles > 0 || scanner.stats.ignoredDirectories > 0) {
      text += `, ignored ${scanner.stats.ignoredDirectories} directories and ${scanner.stats.ignoredFiles} files`;
    }

    socket.logger.info(text);
  };

  const pathValidator = (skipQueueCheck: boolean) => {
    if (!configGetter().ignoreExcluded) {
      return () => true;
    }

    const validate = async (path: string) => {
      try {
        await socket.post('share/validate_path', {
          path,
          skip_check_queue: skipQueueCheck,
        });
      } catch (e) {
        socket.logger.verbose(`Path ${path} is ignored from share (${e.message})`);
        return false;
      }

      return true;
    };

    return validate;
  };

  const ApiErrorLogger = getApiErrorLogger(postEvent);

  const onManualScanCompleted = (scanner: ReturnType<typeof Scanner>) => {
    let text;
    if (scanner.errors.count()) {
      text = `Scan completed and the following problems were found: ${scanner.errors.format()}`;
    } else {
      text = 'Scan completed, no problems were found';
    }

    logCompletedDebug(scanner, `Manual scan completed with maximum concurrency of ${scanner.stats.maxRunning}`);
    postEvent(text, scanner.errors.count() ? SeverityEnum.WARNING : SeverityEnum.INFO);
  };

  // Scan selected paths
  const scanPaths = async (paths: string[]) => {
    const text = paths.length === 1 ? `Scanning the path ${paths[0]}...` : `Scanning ${paths.length} paths...`;
    postEvent(text, SeverityEnum.INFO);

    const scanner = Scanner(configGetter().validators, ApiErrorLogger, pathValidator(false));
    await scanner.scanPaths(paths);
    onManualScanCompleted(scanner);
    
    return scanner;
  };

  // Scan entire share
  const scanShare = async () => {
    const directories = await socket.get<GroupedPath[]>('share/grouped_root_paths');

    postEvent('Scanning shared releases...', SeverityEnum.INFO);
    const scanner = Scanner(configGetter().validators, ApiErrorLogger, pathValidator(false));
    await scanner.scanPaths(directories.reduce(reduceGroupedPath, []));
    onManualScanCompleted(scanner);

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

      postEvent(
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
      const errorLogger = MemoryErrorLogger();

      const scanner = Scanner(configGetter().validators, errorLogger.logger, pathValidator(false));
      await scanner.scanPath(path, false);

      logCompletedDebug(scanner, 'New share directory scan completed');
      if (scanner.errors.count()) {
        // Failed, report and reject
        if (postEventApi) {
          const errorMessage = `Following problems were found while scanning the share directory ${path}: ${scanner.errors.format()}`;
          postEvent(
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
        const shareRoot = await socket.get<ShareRoot>(`share_roots/${id}`);
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
    getShareDirectoryAddedHandler,
    stop,
  };
};

export default ScanRunners;