# airdcpp-release-validator [![Travis][build-badge]][build] [![npm package][npm-badge]][npm] [![Coverage][coverage-badge]][coverage] [![Code climate][climate-badge]][climate]

AirDC++ extension that performs various validations for release directories.

## Features

- Scans the content of completed bundles
- Allows scanning the whole share manually (use the command `/rvalidator scan`)

### Validators

- Checks for missing/extra files based on the SFV file content

>## Help wanted

>Pull requests with new validation modules are welcome. When developing new modules, please write tests as well.


[build-badge]: https://img.shields.io/travis/maksis/airdcpp-release-validator/master.svg?style=flat-square
[build]: https://travis-ci.org/maksis/airdcpp-release-validator

[npm-badge]: https://img.shields.io/npm/v/airdcpp-release-validator.svg?style=flat-square
[npm]: https://www.npmjs.org/package/airdcpp-release-validator

[coverage-badge]: https://codecov.io/gh/maksis/airdcpp-release-validator/branch/master/graph/badge.svg
[coverage]: https://codecov.io/gh/maksis/airdcpp-release-validator
