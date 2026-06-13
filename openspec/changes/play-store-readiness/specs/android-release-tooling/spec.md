## ADDED Requirements

### Requirement: Release signing keystore

The system SHALL have a Java keystore for signing release builds. The keystore SHALL:
- Use RSA 2048-bit key algorithm
- Have a validity of at least 10,000 days
- Be stored in `android/keystore/release.keystore`
- Be excluded from version control via `.gitignore`
- Have its configuration documented in `android/keystore/README.md` including:
  - Keystore generation command
  - Example `keystore.properties` template
  - Play App Signing recommendation and setup steps
  - VersionCode scheme documentation
  - Backup procedures

#### Scenario: Release build is signed
- **GIVEN** a developer runs `./gradlew assembleRelease`
- **WHEN** the build completes
- **THEN** the APK SHALL be signed with the keystore
- **AND** `jarsigner -verify` on the APK SHALL return success

### Requirement: versionCode and versionName

The Android project SHALL have `versionCode` and `versionName` that match the application version defined in `package.json`. The `versionCode` SHALL follow a monotonic scheme: `major*1000000 + minor*10000 + patch*100 + build`.

#### Scenario: Version alignment
- **GIVEN** `package.json` version is `"2.1.5.6"`
- **WHEN** `android/app/build.gradle` is inspected
- **THEN** `versionName` SHALL be `"2.1.5.6"`
- **AND** `versionCode` SHALL be `2010506` (2*1000000 + 1*10000 + 5*100 + 6)
- **AND** `versionCode` SHALL be a monotonically increasing integer for future releases

### Requirement: ProGuard/R8 minification

Release builds SHALL use ProGuard/R8 for code shrinking, obfuscation, and optimization. The following classes SHALL be preserved from obfuscation:
- All `com.getcapacitor.*` classes (including `com.getcapacitor.Bridge`)
- All Capacitor plugin classes: `@capacitor-community/admob`, `@capacitor/share`, `@capacitor/filesystem`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/local-notifications`, `@codetrix-studio/capacitor-google-auth`
- App package classes: `com.walkingfish.easyaccounting.**`
- Google Play Services: `com.google.android.gms.**`
- Any `@JavascriptInterface` annotated methods

#### Scenario: Release build runs after minification
- **GIVEN** the app is built with `./gradlew assembleRelease`
- **WHEN** the APK is installed on a device and launched
- **THEN** the app SHALL start without ClassNotFoundException or NoSuchMethodError
