import SFVChecker from 'validators/SFVChecker';
import path from 'path';
import { getTestScanner } from '../helpers';


describe('SFV checker', () => {
  test('should detect missing and extra files', async () => {
    const scanPath = path.join(__dirname, 'SFVChecker-data/Test.Release-TEST');

    const scanner = getTestScanner([ SFVChecker ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('file_missing')).toEqual(1);
    expect(scanner.errors.count('extra_files')).toEqual(1);
    expect(scanner.errors.count('invalid_sfv_file')).toEqual(0);
  });

  test('should detect invalid SFV files', async () => {
    const scanPath = path.join(__dirname, 'SFVChecker-data/Empty.SFV-TEST');

    const scanner = getTestScanner([ SFVChecker ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('file_missing')).toEqual(0);
    expect(scanner.errors.count('extra_files')).toEqual(0);
    expect(scanner.errors.count('invalid_sfv_file')).toEqual(1);
  });

  test('should not detect audiobook extras', async () => {
    const scanPath = path.join(__dirname, 'SFVChecker-data/Audiobook-(2005)-AUDIOBOOK-2006-TEST');

    const scanner = getTestScanner([ SFVChecker ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count()).toEqual(0);
  });

  test('should perform scan if no release files are present', async () => {
    const scanPath = path.join(__dirname, 'SFVChecker-data/No.Release.Files-TEST');

    const scanner = getTestScanner([ SFVChecker ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('file_missing')).toEqual(3);
    expect(scanner.errors.count('extra_files')).toEqual(0);
    expect(scanner.errors.count('invalid_sfv_file')).toEqual(0);
  });
});