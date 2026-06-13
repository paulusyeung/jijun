## ADDED Requirements

### Requirement: Custom adaptive icon

The app SHALL have a custom adaptive icon (foreground + background layers) that represents the app's accounting purpose, replacing the Android Studio default placeholder.

#### Scenario: Adaptive icon on API 26+
- **GIVEN** a device running Android 8.0 (API 26) or later
- **WHEN** the app is installed
- **THEN** the launcher SHALL display the custom adaptive icon with white background and branded foreground
- **AND** the icon shape SHALL adapt to the device's icon mask (circle, squircle, rounded square)

#### Scenario: Fallback icon on older devices
- **GIVEN** a device running Android 7.0 (API 24-25) or earlier
- **WHEN** the app is installed
- **THEN** the launcher SHALL display the PNG fallback icon from `mipmap-*` directories

### Requirement: Branded splash screen (via @capacitor/splash-screen)

The app SHALL display a branded splash screen on cold start, replacing the default Capacitor splash. Implementation SHALL use `@capacitor/splash-screen` plugin (not legacy `Theme.SplashScreen`).

#### Scenario: Splash on light theme
- **GIVEN** the device's system theme is light
- **WHEN** the app is launched from cold state
- **THEN** the splash screen SHALL display with the wabi theme background color and app logo

#### Scenario: Splash on dark theme
- **GIVEN** the device's system theme is dark
- **WHEN** the app is launched from cold state
- **THEN** the splash screen SHALL display with a dark background variant and app logo

#### Scenario: Splash configuration
- **GIVEN** `capacitor.config.json` has splash screen config
- **WHEN** the app is built and run
- **THEN** `showDuration`, `backgroundColor`, `androidScaleType` SHALL be respected

### Requirement: Edge-to-edge display

The app SHALL display correctly on devices with gesture navigation (Android 10+) — content SHALL NOT overlap with the system status bar or gesture navigation bar. Implementation SHALL use CSS `env(safe-area-inset-bottom)` as primary approach, with Java `WindowInsetsController` fallback in `MainActivity.java` for OEM devices.

#### Scenario: Content inset on gesture navigation
- **GIVEN** a device with gesture navigation enabled (Android 10+)
- **WHEN** the app is launched
- **THEN** the WebView content SHALL be inset to avoid the gesture handle area
- **AND** the bottom navigation bar SHALL not overlap with the system gesture area

#### Scenario: Java fallback for OEM devices
- **GIVEN** a Samsung/Xiaomi device where CSS insets are insufficient
- **WHEN** the app is launched
- **THEN** `MainActivity.java` WindowInsetsController SHALL apply bottom inset to WebView
- **AND** bottom navigation bar SHALL remain accessible

### Requirement: WebView overscroll disabled

The app SHALL disable the blue overscroll glow effect in the Android WebView for a more native feel.

#### Scenario: No overscroll glow
- **GIVEN** the app is running on a native Android device
- **WHEN** the user scrolls past the top or bottom of a page
- **THEN** no blue overscroll glow SHALL appear
