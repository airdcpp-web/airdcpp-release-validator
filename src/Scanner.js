import path from 'path';

import { TotalErrorCounter, ValidatorErrorReporter } from './ErrorCollector';

import fs from 'async-file';


// Scanner instance
const Scanner = (validators, errorLogger) => {
	const errors = TotalErrorCounter();

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
		const content = await parseContent(directoryPath);
		if (!content) {
			return;
		}

		// Validate it
		const promises = validators.map(runValidator.bind(this, content));
		await Promise.all(promises);

		// Scan children
		await Promise.all(content.folders
			.map(name => path.join(directoryPath, name))
			.map(scanPath)
		);
	};

	const scanPaths = (paths) => {
		const promises = paths.map(scanPath);
		return Promise.all(promises);
	};

	return {
		scanPath,
		scanPaths,
		errors,
	};
};

export default Scanner;