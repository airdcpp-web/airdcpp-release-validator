const simpleReleaseReg = /^[A-Z0-9]\S{3,}-[A-Za-z0-9_]{2,}$/; // case sensitive

const isReleaseName = name => name.match(simpleReleaseReg);

module.exports = {
	isReleaseName,
};