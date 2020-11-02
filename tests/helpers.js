import Scanner from '../src/Scanner';


export const MockErrorLogger = error => {
  // console.log(error),
};

export const getTestScanner = (validators) => {
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
