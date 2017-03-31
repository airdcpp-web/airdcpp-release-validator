import fsp from 'fs-promise';
import eol from 'eol';

import path from 'path';

const crc32Reg = /\s(\w{8})$/;


const reduceContent = (reduced, line) => {
	const tokens = line.split(crc32Reg);
	if (tokens[0] && tokens.length > 1) {
		let name = tokens[0];

		// Quoted filename?
		if (name[0] === '"' && name[name.length - 1] === '"') {
			name = name.substring(1, name.length - 1);
		}
		
		reduced[name] = tokens[1];
	}

	return reduced;
};

// Remove lines that have been commented out or contain subdirectories
const filterLines = (line) => {
	return line && line.indexOf(';') === -1 && line.indexOf('\\') === -1;
};

const SFVReader = (directoryPath) => {
	const content = {};

	const load = async (sfvName) => {
		const filePath = path.join(directoryPath, sfvName);
		const stat = await fsp.stat(filePath);

		const sizeMb = stat.size / (1.0*1024.0*1024.0);
		if (sizeMb > 1) {
			throw new Error(`SFV file is too large (${sizeMb} MiB)`);
		}

		const file = await fsp.readFile(filePath, 'utf-8');
		const loaded = eol.split(file)
			.filter(filterLines)
			.reduce(reduceContent, {});

		if (!Object.keys(loaded).length) {
			throw new Error(`No valid lines were parsed from the SFV file`);
		}

		Object.assign(content, loaded);
	};

	return {
		load,
		content,
	};
};

export default SFVReader;
