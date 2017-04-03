import MissingNfo from 'validators/MissingNfo';
import path from 'path';
import Scanner from 'Scanner';


describe('Missing NFO validator', () => {
	const errorLogger = error => console.log(error);

	test('should detect missing NFO files', async () => {
		const scanPath = path.join(__dirname, 'MissingNfo-data/Missing.NFO-TEST');

		const scanner = Scanner([ MissingNfo ], errorLogger);
		await scanner.scanPath(scanPath);

		expect(scanner.errors.count('nfo_missing')).toEqual(1);
	});

	test('should detect NFO files from subdirectories', async () => {
		const scanPath = path.join(__dirname, 'MissingNfo-data/NFO.Subdirectory-Test');
		//const scanPath = 'C:\\Program Files (x86)\\Microsoft Visual Studio 14.0\\';

		const scanner = Scanner([ MissingNfo ], errorLogger);
		await scanner.scanPath(scanPath);

		expect(scanner.errors.count('nfo_missing')).toEqual(0);
	});

	test('should not report non-release directories', async () => {
		const scanPath = path.join(__dirname, 'MissingNfo-data/false.positive-test');

		const scanner = Scanner([ MissingNfo ], errorLogger);
		await scanner.scanPath(scanPath);

		expect(scanner.errors.count('nfo_missing')).toEqual(0);
	});

	test('should handle release subdirectories', async () => {
		const scanPath = path.join(__dirname, 'MissingNfo-data/Release.Subdirectory-Test');

		const scanner = Scanner([ MissingNfo ], errorLogger);
		await scanner.scanPath(scanPath);

		expect(scanner.errors.count('nfo_missing')).toEqual(1);
	});
});