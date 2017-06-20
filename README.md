# airdcpp-release-validator [![Travis][build-badge]][build] [![npm package][npm-badge]][npm] [![Coverage][coverage-badge]][coverage]

AirDC++ extension that performs various validations for release directories.

## Features

- Scans the content of completed bundles: failed bundles are blocked from share with an error message until the error is fixed (or ignored)
- Allows scanning the whole share manually (use the command `/rvalidator scan`)

### Validators

- Checks for missing/extra files based on the SFV file content
- Detect missing/extra SFV/NFO files

## What's new in each version

[Commit log](https://github.com/maksis/airdcpp-release-validator/commits/master)

## Troubleshooting

Enable extension debug mode from application settings and check the extension error logs (`Settings\extensions\airdcpp-release-validator\logs`) for additional information.

## Development

>### Help wanted

>Pull requests with new validation modules are welcome. When developing new modules, please write tests as well.

This extension is based on the [airdcpp-create-extension](https://github.com/airdcpp-web/airdcpp-create-extension) example project, that provides instructions for AirDC++ extension development.

You may run the tests with `npm run test`.


[build-badge]: https://img.shields.io/travis/maksis/airdcpp-release-validator/master.svg?style=flat-square
[build]: https://travis-ci.org/maksis/airdcpp-release-validator

[npm-badge]: https://img.shields.io/npm/v/airdcpp-release-validator.svg?style=flat-square
[npm]: https://www.npmjs.org/package/airdcpp-release-validator

[coverage-badge]: https://codecov.io/gh/maksis/airdcpp-release-validator/branch/master/graph/badge.svg
[coverage]: https://codecov.io/gh/maksis/airdcpp-release-validator
