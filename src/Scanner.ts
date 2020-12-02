import path from 'path';
import fs from 'async-file';

import { TotalErrorCounter, ValidatorErrorReporter } from './errors';

import { DirectoryInfo, ErrorLogger, ErrorType, Validator } from './types';


type PathValidator = (path: string) => Promise<boolean> | boolean;

// Scanner instance
const Scanner = (validators: Validator[], errorLogger: ErrorLogger, validatePath: PathValidator) => {
  const start = new Date();

  const errors = TotalErrorCounter();
  let running = 0, maxRunning = 0, scannedDirectories = 0, scannedFiles = 0, ignoredFiles = 0, ignoredDirectories = 0;

  // Add file in content info object
  // Returns false in case of errors
  const parseFile = async (directoryInfo: DirectoryInfo, name: string) => {
    const fullPath = path.join(directoryInfo.path, name);

    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch (e) {
      errors.add('disk_read_error', `Failed to read file: ${e}`, ErrorType.INVALID_CONTENT);
      return false;
    }

    if (stat.isFile()) {
      if (!await validatePath(fullPath)) {
        ignoredFiles++;
        return false;
      }

      const extension = path.extname(name).toLowerCase();
      if (extension === '.sfv') {
        directoryInfo.sfvFiles.push(name);
      } else if (extension === '.nfo') {
        directoryInfo.nfoFiles.push(name);
      } else {
        directoryInfo.files.push(name);
      }
    } else {
      if (!await validatePath(fullPath + path.sep)) {
        ignoredDirectories++;
        return false;
      }

      directoryInfo.folders.push(name);
    }

    return true;
  };

  // Return info object about the folder content
  const parseContent = async (directoryPath: string) => {
    let contentList;

    try {
      contentList = await fs.readdir(directoryPath);
    } catch (e) {
      errors.add('disk_read_error', `Failed to read disk content: ${e}`, ErrorType.INVALID_CONTENT);
      return null;
    }

    const info = {
      name: path.parse(directoryPath).base,
      path: directoryPath,
      files: [],
      folders: [],
      sfvFiles: [],
      nfoFiles: [],
    };

    const contentResults = await Promise.all(contentList.map(parseFile.bind(this, info)));
    if (contentResults.every(res => res === false)) {
      // All files failed, don't proceed with the scan as the scanners would just add confusing errors if there is no content
      return null;
    }

    return info;
  };

  const runValidator = async (content: DirectoryInfo, validator: Validator) => {
    if (validator.validateCondition && !validator.validateCondition(content)) {
      return;
    }

    const validatorErrors = ValidatorErrorReporter(content, errors, errorLogger);
    await validator.validate(content, validatorErrors);
    validatorErrors.flush();
  };

  const scanPath = async (directoryPath: string, recursive = true) => {
    running++;
    if (running > maxRunning) {
      maxRunning = running;
    }

    const content = await parseContent(directoryPath);
    if (!content) {
      running--;
      return;
    }

    // Validate it
    const promises = validators.map(runValidator.bind(this, content));
    await Promise.all(promises);

    running--;
    scannedDirectories++;
    scannedFiles += content.files.length + content.sfvFiles.length + content.nfoFiles.length;

    if (recursive) {
      // Scan children
      // Use sequential scan to avoid piling up too many tasks 
      // (and the extension becoming unresponsive)
      const childPaths = content.folders.map(name => path.join(directoryPath, name) + path.sep);
      await scanPathsSequential(childPaths);
    }
  };

  const scanPathsConcurrent = async (paths: string[]) => {
    await Promise.all(paths.map(p => scanPath(p)));
  };

  const scanPathsSequential = async (paths: string[]) => {
    for (let p of paths) {
      await scanPath(p);
    }
  };

  const scanPaths = async (paths: string[]) => {
    await scanPathsConcurrent(paths);
  };

  return {
    scanPath,
    scanPaths,
    errors,
    get stats() {
      return {
        maxRunning,
        duration: new Date().getTime() - start.getTime(),

        scannedDirectories,
        scannedFiles,

        ignoredDirectories,
        ignoredFiles,
      };
    }
  };
};

export type ScannerType = ReturnType<typeof Scanner>;

export default Scanner;