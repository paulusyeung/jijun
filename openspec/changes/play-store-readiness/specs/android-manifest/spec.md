## MODIFIED Requirements

### Requirement: Production AdMob App ID

The `AndroidManifest.xml` AdMob `APPLICATION_ID` meta-data SHALL use the production AdMob App ID instead of the test ID.

#### Scenario: Production ID in manifest
- **GIVEN** the AndroidManifest.xml file
- **WHEN** inspecting `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID">`
- **THEN** the `android:value` SHALL be the production AdMob App ID
- **AND** it SHALL NOT be `ca-app-pub-3940256099942544~3347511713`

### Requirement: Production AdMob ad unit IDs

The `package.json` -> `adConfig` section SHALL use the production AdMob banner and rewarded ad unit IDs instead of the test IDs. The `isTesting` flag SHALL be `false`.

#### Scenario: Production IDs in build config
- **GIVEN** the `package.json` file
- **WHEN** inspecting `adConfig`
- **THEN** `admobBannerId` SHALL be the production banner ad unit ID
- **AND** `admobRewardedId` SHALL be the production rewarded ad unit ID
- **AND** `isTesting` SHALL be `false`

### Requirement: Privacy Policy URL in Play Console (NOT in manifest)

The Privacy Policy URL SHALL be configured in Play Console → App content → Privacy policy. The `AndroidManifest.xml` SHALL NOT contain a privacy policy attribute (AdMob meta-data only accepts App ID).

#### Scenario: Privacy policy configured in Play Console
- **GIVEN** the Play Console app listing
- **WHEN** checking App content → Privacy policy
- **THEN** a valid URL SHALL be present
- **AND** `AndroidManifest.xml` SHALL only have AdMob `APPLICATION_ID` meta-data
