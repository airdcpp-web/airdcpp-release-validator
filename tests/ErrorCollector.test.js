import { MockErrorLogger as errorLogger } from './helpers';
import {
  ErrorType,
  TotalErrorCounter,
  ValidatorErrorReporter,
} from 'ErrorCollector';

describe('Error collector', () => {
  const getCollectors = () => {
    const directoryInfo = {
      path: 'mock_path',
    };

    const totalCounter = TotalErrorCounter();

    const validatorErrors = ValidatorErrorReporter(
      directoryInfo,
      totalCounter,
      errorLogger
    );

    return { validatorErrors, totalCounter };
  };

  test('should report missing files', async () => {
    const { validatorErrors, totalCounter } = getCollectors();
    validatorErrors.addFile(
      'mock_file1',
      'files_missing1',
      'File missing',
      ErrorType.ITEMS_MISSING
    );
    validatorErrors.addFile(
      'mock_file2',
      'files_missing2',
      'File missing',
      ErrorType.ITEMS_MISSING
    );

    const error = totalCounter.pickOne();
    expect(error).toMatchInlineSnapshot(`
      Object {
        "id": "items_missing",
        "message": "File missing",
      }
    `);
  });

  test('should report extra files', async () => {
    const { validatorErrors, totalCounter } = getCollectors();
    validatorErrors.addFile(
      'mock_file1',
      'files_extras1',
      'Extra file',
      ErrorType.EXTRA_ITEMS
    );
    validatorErrors.addFile(
      'mock_file2',
      'files_extras2',
      'Extra file',
      ErrorType.EXTRA_ITEMS
    );

    const error = totalCounter.pickOne();
    expect(error).toMatchInlineSnapshot(`
      Object {
        "id": "extra_items",
        "message": "Extra file",
      }
    `);
  });

  test('should report mixed types', async () => {
    const { validatorErrors, totalCounter } = getCollectors();
    validatorErrors.addFile(
      'mock_file1',
      'files_missing1',
      'File missing',
      ErrorType.ITEMS_MISSING
    );
    validatorErrors.addFile(
      'mock_file2',
      'files_extras2',
      'Extra file',
      ErrorType.EXTRA_ITEMS
    );

    const error = totalCounter.pickOne();
    expect(error).toMatchInlineSnapshot(`
      Object {
        "id": "invalid_content",
        "message": "File missing",
      }
    `);
  });
});
