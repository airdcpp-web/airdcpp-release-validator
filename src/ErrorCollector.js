import path from 'path';

export const ValidatorErrorReporter = (directoryInfo, totalErrors, logger) => {
	const validatorErrors = {};

	const reduceMessage = (reducedText, fileName, index) => {
		return reducedText + (index !== 0 ? ', ' : '') + fileName;
	};

	const flush = () => {
		Object.keys(validatorErrors).forEach(id => {
			const error = validatorErrors[id];

			const fileListing = error.files.reduce(reduceMessage, '');
			logger(`${directoryInfo.path}${path.sep}: ${error.message} (${error.files.length} file(s): ${fileListing})`);
		});
	};

	const addFile = (fileName, errorId, message) => {
		validatorErrors[errorId] = validatorErrors[errorId] || {
			files: [],
			message,
		};

		validatorErrors[errorId].files.push(fileName);

		totalErrors.add(errorId, message);
	};

	return {
		addFile,
		flush,
	};
};

export const TotalErrorCounter = () => {
	const errors = {};

	// REPORTING
	const formatErrorCount = (error) => {
		let message = error.message;
		message = message.charAt(0).toLowerCase() + message.substr(1);
		return `${message} (count: ${error.count})`
	};

	const reduceMessage = (reducedText, errorId, index) => {
		return reducedText + (index !== 0 ? ', ' : '') + formatErrorCount(errors[errorId]);
	};

	const format = () => {
		return Object.keys(errors).reduce(reduceMessage, '');
	};


	// ADDING ERRORS
	const add = (errorId, message) => {
		errors[errorId] = errors[errorId] || {
			count: 0,
			message,
		};

		errors[errorId].count++;
	};


	// MISC

	// Get error count by type
	// If no type is specified, total error count is returned
	const count = (errorId) => {
		if (errorId) {
			return errors[errorId] ? errors[errorId].count : 0;
		}

		return Object.keys(errors).reduce((total, id) => {
			return total + errors[id].count;
		}, 0);
	};

	// Return a single error
	const pickOne = () => {
		const id = Object.keys(errors)[0];
		return {
			id,
			message: errors[id].message,
		};
	};

	return {
		add,
		count,
		format,
		pickOne,
		getErrors: () => errors,
	};
};