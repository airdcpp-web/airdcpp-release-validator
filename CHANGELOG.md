## Version 1.4.0 (2023-05-26)

- Allow scanning directories in own filelist (minimum required application version is AirDC++ Web Client 2.12 or AirDC++ 4.21b)
- Responses to chat commands will be sent only to UI instance that initiated the command (minimum required application version is AirDC++ Web Client 2.12 or AirDC++ 4.21b)
- Fix error "Failed to open scan results: getaddrinfo ENOTFOUND [::1]" on Linux when the option "Open manual scan results in a separate file/tab" is enabled

### Version 1.3.1 (2023-03-10)

- SFV reader: fix handling of multiple whitespaces after the filename

### Version 1.3.0 (2021-12-14)

- Add proper error reporting for files that are ignored from share
- Drop support for Node.js 10

### Version 1.2.3 (2021-01-05)

- Avoid timeouts when the system is unresponsive
- Fix compatibility with older node versions (< 12)

### Version 1.2.2 (2021-01-01)

- Prevent exits due to timeouts when the system is unresponsive (only when using AirDC++ 4.01 or AirDC++ Web Client 2.11.0)

### Version 1.2.1 (2020-12-06)

- Fix a crash with application versions older than 2.10.0

### Version 1.2.0 (2020-12-04)

- Add an option to show manual scan results in a separate file
- Ignore items excluded from share by default on Windows

### Version 1.1.3 (2020-12-02)

- Show better rejection message for new share directories
- Log maximum of 25 missing file names for each directory
- Update the repository URL
- Internal: migrate the project to TypeScript

### Version 1.1.2 (2020-11-08)

- Run validations for non-shared bundles on startup to avoid them from being added in share (requires Web Client 2.10.0 or newer)

### Version 1.1.1 (2020-11-02)

- Return more generic error IDs for hook rejections (files_missing, extra_files, invalid_content)

### Version 1.1.0 (2020-10-20)

- Add an option for ignoring files/directories that are excluded from share (disabled by default)
- Fix share roots not being scanned recursively
- Log scan duration in the extension log file
- Fix a crash if reading of file/directory properties fails

### Version 1.0.0 (2020-07-11)

- Add extension context menu item for scanning the whole share
- Add context menu item for scanning specific share roots
- Add an option to automatically scan new share directories (enabled by default)
- Use the new non-blocking chat command API listeners for handling chat commands