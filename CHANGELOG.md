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