import path from 'path';

import { TotalErrorCounter, ValidatorErrorReporter } from './ErrorCollector';

import fs from 'async-file';


// Scanner instance
const Scanner = (validators, errorLogger, validatePath) => {
  const start = new Date();

  const errors = TotalErrorCounter();
  let running = 0, maxRunning = 0, scannedDirectories = 0, scannedFiles = 0, ignoredFiles = 0, ignoredDirectories = 0;

  // Add file in content info object
  const parseFile = async (directoryInfo, name) => {
    const fullPath = path.join(directoryInfo.path, name);

    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch (e) {
      errors.add('disk_read_error', `Failed to read file: ${e}`);
      return;
    }

    if (stat.isFile()) {
      if (!await validatePath(fullPath)) {
        ignoredFiles++;
        return;
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
        return;
      }

      directoryInfo.folders.push(name);
    }
  };

  // Return info object about the folder content
  const parseContent = async (directoryPath) => {
    let contentList;

    try {
      contentList = await fs.readdir(directoryPath);
    } catch (e) {
      errors.add('disk_read_error', `Failed to read disk content: ${e}`);
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

    await Promise.all(contentList.map(parseFile.bind(this, info)));
    return info;
  };

  const runValidator = async (content, validator) => {
    if (validator.validateCondition && !validator.validateCondition(content)) {
      return;
    }

    const validatorErrors = ValidatorErrorReporter(content, errors, errorLogger);
    await validator.validate(content, validatorErrors);
    validatorErrors.flush();
  };

  const scanPath = async (directoryPath, recursive = true) => {
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

  const scanPathsConcurrent = async (paths) => {
    await Promise.all(paths.map(p => scanPath(p)));
  };

  const scanPathsSequential = async (paths) => {
    for (let p of paths) {
      await scanPath(p);
    }
  };

  const scanPaths = async (paths) => {
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

export default Scanner;