## ADDED Requirements

### Requirement: Native share sheet for export

When running on a native Android device, the app SHALL use `@capacitor/share`'s `Share.share()` to invoke the native Android share sheet for sharing exported data files. On web, it SHALL fall back to `navigator.share()` or clipboard copy.

#### Scenario: Share exported data from Settings
- **GIVEN** the user is on a native Android device
- **WHEN** they tap "分享應用程式" or complete an export in Settings
- **THEN** the native Android share sheet SHALL appear with the file attached
- **AND** the share text SHALL include the app name and version

#### Scenario: Share on web falls back gracefully
- **GIVEN** the user is on a web browser
- **WHEN** they tap "分享應用程式"
- **THEN** the browser's native share sheet SHALL appear if available
- **OR** the app SHALL copy the app URL to clipboard and show a toast

### Requirement: Share plugin integration

The `@capacitor/share` plugin SHALL be installed and synced. A `nativeShare(data)` wrapper SHALL be added to `src/js/utils.js` with platform detection.

#### Scenario: Platform detection
- **GIVEN** the app runs on native Android
- **WHEN** `nativeShare()` is called
- **THEN** `Share.share()` SHALL be used
- **AND** on web, `navigator.share()` or clipboard fallback SHALL be used
