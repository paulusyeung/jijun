## ADDED Requirements

### Requirement: Native file picker for imports

When running on a native Android device, the app SHALL use `@capacitor/filesystem`'s `pickFile()` to open the native file chooser for data import (CSV/JSON). When running on web, it SHALL fall back to the existing `<input type="file">` approach.

#### Scenario: Import on native Android
- **GIVEN** the user is on a native Android device
- **WHEN** they tap "匯入資料" in Settings
- **THEN** the native Android file picker SHALL open
- **AND** allowed file types SHALL include `.csv` and `.json`

#### Scenario: Import on web falls back
- **GIVEN** the user is on a web browser
- **WHEN** they tap "匯入資料" in Settings
- **THEN** the browser's file input dialog SHALL open (existing behavior preserved)

### Requirement: Native save file for exports

When running on a native Android device, the app SHALL use `@capacitor/filesystem`'s `writeFile()` to save exported data to a user-accessible location (Downloads directory). On web, existing browser download behavior SHALL be preserved.

#### Scenario: Export on native Android
- **GIVEN** the user is on a native Android device
- **WHEN** they export data from Settings
- **THEN** the file SHALL be saved to the device's Downloads directory
- **AND** the user SHALL see a confirmation toast with the file path

### Requirement: Filesystem plugin integration

The `@capacitor/filesystem` plugin SHALL be installed and synced. Wrapper functions SHALL be added to `src/js/utils.js` for `pickFile()`, `writeFile()`, and `readFile()` with platform detection (`Capacitor.isNativePlatform()`).

#### Scenario: Platform detection
- **GIVEN** the app runs on native Android
- **WHEN** `nativeFilePicker()` is called
- **THEN** `Filesystem.pickFile()` SHALL be used
- **AND** on web, `<input type="file">` fallback SHALL be used
