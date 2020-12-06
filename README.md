# airdcpp-release-validator [![Travis][build-badge]][build] [![npm package][npm-badge]][npm] [![Coverage][coverage-badge]][coverage]

AirDC++ extension that performs various validations for release directories.

## Features

- Scans the content of completed bundles: failed bundles are blocked from share with an error message until the error is fixed (or ignored)
- Allows scanning the whole share manually (use the command `/rvalidator scan`)

### Validators

- Checks for missing/extra files based on the SFV file content
- Detect missing/extra SFV/NFO files

All error will be reported in the event/system log. 

**Example output:**

```
[airdcpp-release-validator] C:\testshare\Release.App-TESTING\: NFO file possibly missing
[airdcpp-release-validator] C:\testshare\Missing.Files-TESTING\: File listed in the SFV file does not exist on disk (2 file(s): testfile1.mp3, testfile2.mp3)
[airdcpp-release-validator] E:\Downloads\SFV-TESTING\: NFO/SFV found but there are no other files in the folder
```

## What's new in each version

[Changelog](https://github.com/airdcpp-web/airdcpp-release-validator/blob/master/CHANGELOG.md)

## Troubleshooting

Enable extension debug mode from application settings and check the extension error logs (`Settings\extensions\airdcpp-release-validator\logs`) for additional information.

## Development

>### Help wanted

>Pull requests with new validation modules are welcome. When developing new modules, please write tests as well.

This extension is based on the [airdcpp-create-extension](https://github.com/airdcpp-web/airdcpp-create-extension) example project, that provides instructions for AirDC++ extension development.

You may run the tests with `npm run test`.


[build-badge]: https://img.shields.io/travis/airdcpp-web/airdcpp-release-validator/master.svg?style=flat-square
[build]: https://travis-ci.org/airdcpp-web/airdcpp-release-validator

[npm-badge]: https://img.shields.io/npm/v/airdcpp-release-validator.svg?style=flat-square
[npm]: https://www.npmjs.org/package/airdcpp-release-validator

[coverage-badge]: https://codecov.io/gh/airdcpp-web/airdcpp-release-validator/branch/master/graph/badge.svg
[coverage]: https://codecov.io/gh/airdcpp-web/airdcpp-release-validator
