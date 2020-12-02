import MissingSfv from 'validators/MissingSfv';
import path from 'path';
import { getTestScanner } from '../helpers';


describe('Extra SFV validator', () => {
  test('should detect missing SFV files', async () => {
    const scanPath = path.join(__dirname, 'MissingSfv-data/Missing.SFV-TEST');

    const scanner = getTestScanner([ MissingSfv ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('sfv_missing')).toEqual(1);
  });

  test('should not detect false SFV positives', async () => {
    const scanPath = path.join(__dirname, 'MissingSfv-data/False.Positives-TEST');

    const scanner = getTestScanner([ MissingSfv ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('sfv_missing')).toEqual(0);
  });

  test('should not detect false SFV positives when non MP3 file matches MP3 regex', async () => {
    const scanPath = path.join(__dirname, 'MissingSfv-data/False.Positive.Mp3-TEST');

    const scanner = getTestScanner([ MissingSfv ]);
    await scanner.scanPath(scanPath);

    expect(scanner.errors.count('sfv_missing')).toEqual(0);
  });
});
