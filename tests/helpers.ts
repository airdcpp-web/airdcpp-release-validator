import { Validator } from 'types';
import Scanner from '../src/Scanner';


export const MockErrorLogger = (error: string) => {
  // console.log(error),
};

export const getTestScanner = (validators: Validator[]) => {
  return Scanner(
    validators,
    MockErrorLogger,
    () => true,
  )
};

export const MockLogger = {
  verbose: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
