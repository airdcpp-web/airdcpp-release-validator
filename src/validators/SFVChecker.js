import path from 'path';
import SFVReader from '../SFVReader';
 
 
const audioBookExtrasReg = /^(.+\.(jp(e)?g|png|m3u|cue|zip|sfv|nfo))$/i;
const flacExtrasReg = /^(.+\.(jp(e)?g|png|m3u|cue|log|sfv|nfo))$/i;
const normalExtrasReg = /^(.+\.(jp(e)?g|png|m3u|cue|diz|sfv|nfo))$/i;
 
const audioBookReg = /^(.+(-|\()AUDIOBOOK(-|\)).+)$/i;
const flacReg = /^(.+(-|\()(LOSSLESS|FLAC)((-|\)).+)?)$/i;
 
 
// Get regex for allowed extra files (type is detected from the directory name)
const getExtrasReg = (name) => {
	if (audioBookReg.test(name)) {
		return audioBookExtrasReg;
	} else if (flacReg.test(name)) {
		return flacExtrasReg;
	}

	return normalExtrasReg;
};
 
const validateCondition = directory => directory.sfvFiles.length;

const isSfvOrNfo = (name) => {
	const ext = path.extname(name);
	return ext === '.nfo' || ext === '.sfv';
};
 
const validate = async (directory, reporter) => {
	// Name comparisons should be case insensitive
	// as wrong case sizing in SFV files is rather common
	// Keep the original names available for reporting
	const files = {};
	directory.files.forEach(name => files[name.toLowerCase()] = name);


	// Load SFV files
	const reader = SFVReader(directory.path);

	let loadedSfvFiles = 0;
	await Promise.all(directory.sfvFiles.map(async (file) => {
		try {
			await reader.load(file);
			loadedSfvFiles++;
		} catch (e) {
			reporter.addFile( file, 'invalid_sfv_file', e);
		}
	}));

	if (!loadedSfvFiles) {
		return;
	}

	// Iterate through the SFV file and compare with the content
	// Matching files are removed so that we can detect extras
	Object.keys(reader.content).forEach(file => {
		const fileLower = file.toLowerCase();

		// Some (bad) SFV files also list NFO/SFV files... don't report them
		if (!files[fileLower] && !isSfvOrNfo(fileLower)) {
			reporter.addFile(file, 'file_missing', 'File listed in the SFV file does not exist on disk');
		} else {
			delete files[fileLower];
		}
	});

	// Extra files
	if (Object.keys(files).length > 0) {
		const extrasReg = getExtrasReg(directory.name);
		Object.values(files).forEach(file => {
			if (!extrasReg.test(file)) {
				reporter.addFile(file, 'extra_files', 'Extra files in release directory');
			}
		});
	}
};
 
export default {
	validateCondition,
	validate,
	setting: {
		key: 'scan_sfv_file',
		title: 'Check content based on SFV files',
		default_value: true,
		type: 'boolean'
	},
}
