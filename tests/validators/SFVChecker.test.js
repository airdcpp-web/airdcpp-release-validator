import SFVChecker from 'validators/SFVChecker';
import path from 'path';
import Scanner from 'Scanner';


describe('SFV checker', () => {
	const errorLogger = error => console.log(error);

	test('should detect missing and extra files', async () => {
		const scanPath = path.join(__dirname, 'SFVChecker-data/Test.Release-TEST');

		const scanner = Scanner([ SFVChecker ], errorLogger);
		await scanner.scanPath(scanPath);

		expect(scanner.errors.count('file_missing')).toEqual(1);
		expect(scanner.errors.count('extra_files')).toEqual(1);
	});

	test('should detect invalid SFV files', async () => {
		const scanPath = path.join(__dirname, 'SFVChecker-data/Empty.SFV-TEST');

		const scanner = Scanner([ SFVChecker ], errorLogger);
		await scanner.scanPath(scanPath);

		expect(scanner.errors.count('file_missing')).toEqual(0);
		expect(scanner.errors.count('extra_files')).toEqual(0);
		expect(scanner.errors.count('invalid_sfv_file')).toEqual(1);
	});

	test('should not detect audiobook extras', async () => {
		const scanPath = path.join(__dirname, 'SFVChecker-data/Audiobook-(2005)-AUDIOBOOK-2006-TEST');

		const scanner = Scanner([ SFVChecker ], errorLogger);
		scanner.scanPath(scanPath);

		expect(scanner.errors.count()).toEqual(0);
	});
});