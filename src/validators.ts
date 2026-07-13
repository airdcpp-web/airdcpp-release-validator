
// List of available validators

import SFVChecker from './validators/SFVChecker';
import MissingSfv from './validators/MissingSfv';
import MissingNfo from './validators/MissingNfo';
import ExtraNfoSfv from './validators/ExtraNfoSfv';

const Validators = [
  SFVChecker,
  MissingSfv,
  MissingNfo,
  ExtraNfoSfv,
];

export default Validators;