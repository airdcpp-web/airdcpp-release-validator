
// List of available validators

const Validators = [
	require('./validators/SFVChecker').default,
	require('./validators/MissingSfv').default,
	require('./validators/MissingNfo').default,
	require('./validators/ExtraNfoSfv').default,
];

export default Validators;