import SFVReader from 'helpers/SFVReader';
import path from 'path';


describe('SFV reader', () => {
  test('should load file', async () => {
    const reader = SFVReader(path.join(__dirname, 'data'));
    await reader.load('test.sfv');

    expect(reader.content).toEqual({
      valid1: 'f8d45d01',
      valid2: 'f8d45d01',
    });
  });

  test('should reject invalid files', async () => {
    const reader = SFVReader(path.join(__dirname, 'data'));

    let thrown;
    try {
      await reader.load('empty.sfv');
    } catch (e) {
      thrown = true;
    }

    expect(thrown).toEqual(true);
  });
});