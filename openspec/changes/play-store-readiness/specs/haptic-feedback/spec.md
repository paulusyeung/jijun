## ADDED Requirements

### Requirement: Haptic feedback on keypad press

When running on a native Android device, the custom number keypad in the add-record page SHALL trigger a short vibration on digit press, delete, and confirm actions. Haptic feedback SHALL be controlled by a user setting (`enableHapticFeedback`) stored in IndexedDB, defaulting to `true`. Calls to `Haptics.vibrate()` SHALL be debounced to prevent vibration queue buildup on rapid taps.

#### Scenario: Keypad press triggers vibration
- **GIVEN** the user is on a native Android device
- **AND** `enableHapticFeedback` is `true`
- **WHEN** the user taps a digit on the custom number keypad
- **THEN** `Haptics.vibrate()` SHALL be called with default duration
- **AND** the digit SHALL be entered as normal

#### Scenario: Haptic feedback disabled by setting
- **GIVEN** the user is on a native Android device
- **AND** `enableHapticFeedback` is `false`
- **WHEN** the user taps a digit on the custom number keypad
- **THEN** no vibration SHALL occur
- **AND** the digit SHALL be entered as normal

#### Scenario: Debounced vibration on rapid taps
- **GIVEN** the user rapidly taps multiple keys
- **WHEN** `triggerHaptic()` is called in quick succession
- **THEN** only one vibration SHALL occur per ~50ms window (debounced)

### Requirement: Haptic feedback setting in Settings page

The Settings page SHALL have a toggle for "按鍵震動回饋" under the "應用程式設定" section (after "深色模式" toggle), controlling the `enableHapticFeedback` IndexedDB setting.

#### Scenario: Toggle changes setting
- **GIVEN** the user is on the Settings page
- **WHEN** they toggle "按鍵震動回饋" off
- **THEN** `enableHapticFeedback` in IndexedDB SHALL be set to `false`
- **WHEN** they toggle it back on
- **THEN** `enableHapticFeedback` in IndexedDB SHALL be set to `true`

### Requirement: Haptic feedback on bottom nav

When running on a native Android device, bottom navigation item clicks SHALL trigger haptic feedback (if enabled).

#### Scenario: Bottom nav click triggers vibration
- **GIVEN** the user is on a native Android device
- **AND** `enableHapticFeedback` is `true`
- **WHEN** the user taps a bottom nav item
- **THEN** `Haptics.vibrate()` SHALL be called with default duration
