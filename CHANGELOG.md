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