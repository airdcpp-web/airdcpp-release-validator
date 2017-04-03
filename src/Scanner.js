import path from 'path';

import { TotalErrorCounter, ValidatorErrorReporter } from './ErrorCollector';

import fs from 'async-file';


// Scanner instance
const Scanner = (validators, errorLogger) => {
	const errors = TotalErrorCounter();
	let running = 0, maxRunning = 0, scanned = 0;

	// Add file in content info object
	const parseFile = async (directoryInfo, name) => {
		const fullPath = path.join(directoryInfo.path, name);
		const stat = await fs.stat(fullPath);
		if (stat.isFile()) {
			const extension = path.extname(name).toLowerCase();
			if (extension === '.sfv') {
				directoryInfo.sfvFiles.push(name);
			} else if (extension === '.nfo') {
				directoryInfo.nfoFiles.push(name);
			} else {
				directoryInfo.files.push(name);
			}
		} else {
			directoryInfo.folders.push(name);
		}
	};

	// Return info object about the folder content
	const parseContent = async (directoryPath) => {
		let contentList;

		try {
			contentList = await fs.readdir(directoryPath);
		} catch (e) {
			console.error(`Failed to scan the path ${path}: ${e}`);
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

	const scanPath = async (directoryPath) => {
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
		scanned++;

		// Scan children
		// Use sequential scan to avoid piling up too many tasks 
		// (and the extension becoming unresponsive)
		const childPaths = content.folders.map(name => path.join(directoryPath, name) + path.sep);
		await scanPathsSequential(childPaths);
	};

	const scanPathsConcurrent = async (paths) => {
		await Promise.all(paths.map(scanPath));
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
				scanned,
			};
		}
	};
};

export default Scanner;