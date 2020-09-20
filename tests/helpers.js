import Scanner from '../src/Scanner';


export const getTestScanner = (validators) => {
  return Scanner(
    validators,
    error => console.log(error),
    () => true,
  )
};
