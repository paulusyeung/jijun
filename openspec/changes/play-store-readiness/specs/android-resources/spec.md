## ADDED Requirements

### Requirement: colors.xml resource file

The Android project SHALL have a `colors.xml` resource file defining `colorPrimary`, `colorPrimaryDark`, `colorAccent`, and `ic_launcher_background` using the application's wabi theme color palette.

#### Scenario: colors.xml resolves theme references
- **GIVEN** the file `android/app/src/main/res/values/colors.xml` exists
- **WHEN** inspecting its contents
- **THEN** `colorPrimary` SHALL be `#334A52`
- **AND** `colorPrimaryDark` SHALL be `#1F2E33`
- **AND** `colorAccent` SHALL be `#E2B67A`
- **AND** `ic_launcher_background` SHALL be `#FFFFFF`
- **WHEN** `./gradlew assembleDebug` runs
- **THEN** the build SHALL succeed without resource-not-found errors
