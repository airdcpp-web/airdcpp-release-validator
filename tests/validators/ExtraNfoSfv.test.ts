import ExtraNfoSfv from 'validators/ExtraNfoSfv';
import path from 'path';
import { getTestScanner } from '../helpers';


describe('Missing NFO/SFV validator', () => {
  test('should detect duplicate NFO and SFV files', async () => {
    const scanPath = path.join(__dirname, 'ExtraNfoSfv-data/Duplicate.NFO.SFV-TEST');

    const scanner = getTestScanner([ ExtraNfoSfv ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('multiple_nfo_files')).toEqual(1);
    expect(scanner.errors.count('multiple_sfv_files')).toEqual(1);
    expect(scanner.errors.count('no_release_files')).toEqual(0);
  });

  test('should detect directories with no release files', async () => {
    const scanPath = path.join(__dirname, 'ExtraNfoSfv-data/Release.Files.Missing-TEST');

    const scanner = getTestScanner([ ExtraNfoSfv ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('no_release_files')).toEqual(1);
    expect(scanner.errors.count('multiple_nfo_files')).toEqual(0);
    expect(scanner.errors.count('multiple_sfv_files')).toEqual(0);
  });

  test('should not detect nfo fix directories', async () => {
    const scanPath = path.join(__dirname, 'ExtraNfoSfv-data/Test.NFO.FIX-TEST');

    const scanner = getTestScanner([ ExtraNfoSfv ]);
    scanner.scanPath(scanPath);

    expect(scanner.errors.count('no_release_files')).toEqual(0);
    expect(scanner.errors.count('multiple_nfo_files')).toEqual(0);
    expect(scanner.errors.count('multiple_sfv_files')).toEqual(0);
  });
});