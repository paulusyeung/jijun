## Why

The app already ships with a full Capacitor Android project but has several issues that block or degrade a Play Store release: missing resource files (colors.xml — build fails), placeholder branding, test Ad IDs, disabled optimizations, and no keystore configuration. Additionally, the user experience lacks native polish that simple plugin additions could provide (haptic feedback on the custom keypad, native share sheet for data export, native file picker for import/export).

> **Note**: This change is intentionally scoped to cover all Play Store readiness work in one pass. If any phase blocks during implementation, consider splitting into separate changes: `play-store-release-setup` (Phase 1), `android-polish` (Phase 2), `native-enhancements` (Phase 3).

## What Changes

**Play Store Blockers (Phase 1):**
- Add missing `colors.xml` with `colorPrimary`, `colorPrimaryDark`, `colorAccent` values matching the app's wabi theme (build fails without this)
- Replace placeholder adaptive icon foreground with a custom branded vector graphic
- Swap AdMob test IDs for production IDs in both `AndroidManifest.xml` and `package.json` (with graceful fallback if ads fail to load)
- Set `versionCode` and `versionName` to match the current app version (2.1.5.6) using monotonic scheme
- Generate an app signing keystore, configure via `keystore.properties`, and document Play App Signing recommendation
- Configure Privacy Policy URL in Play Console (Play Store requirement — not in AndroidManifest)
**Release Quality (Phase 2):**
- Enable `minifyEnabled true` with ProGuard/R8 rules to shrink and obfuscate the APK/AAB
- Replace default Capacitor splash screen with a branded splash asset
- Add edge-to-edge display handling (gesture navigation insets, status bar contrast, bottom nav padding)
- Add dark-mode-aware splash screen background
- Disable WebView overscroll glow for a more native feel
- Build and verify AAB format (`bundleRelease`) — Play Store now requires AAB, not APK

**New Native Plugins (Phase 3):**
- `@capacitor/share` — native share sheet for data export and app sharing
- `@capacitor/filesystem` — native file picker for CSV/JSON import/export
- `@capacitor/haptics` — tactile feedback on the custom number keypad
- `capacitor-rate-app` (or verified alternative) — in-app Play Store rating prompt triggered by usage milestones, with periodic re-prompt per version
- `@capacitor/status-bar` — per-page status bar styling for theme-aware pages

**Pre-Launch Checklist (Phase 0):**
- Privacy Policy URL configured in Play Console (NOT in AndroidManifest)
- Content Rating Questionnaire (IARC) completed in Play Console
- App listing assets prepared (screenshots, feature graphic, description)

## Capabilities

### New Capabilities
- `android-release-tooling`: Keystore configuration via properties file, ProGuard rules, version management, AAB build target
- `native-file-picker`: Replace browser file dialogs with native file chooser for import/export
- `native-share-sheet`: Native Android share intent for data export and app links
- `haptic-feedback`: Vibration/tactile feedback on keypad and button interactions
- `in-app-review-system`: Usage-triggered Play Store rating prompts (once per major version)
- `adaptive-branding`: Custom adaptive icon, branded splash, edge-to-edge display with bottom nav inset handling

### Modified Capabilities
- `android-manifest`: AdMob IDs updated from test to production (privacy policy in Play Console)
- `android-resources`: `colors.xml` created, splash assets replaced, icon vectors updated

## Impact

- **android/app/src/main/res/values/colors.xml**: New file — defines wabi theme colors (build dependency)
- **android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml**: Replaced with branded vector
- **android/app/src/main/res/drawable/**: Splash assets replaced with branded versions (light + dark)
- **android/app/src/main/AndroidManifest.xml**: AdMob App ID changed to production (no privacy policy attribute)
- **android/app/build.gradle**: versionCode/versionName updated (monotonic scheme), minifyEnabled true, ProGuard config, keystore signing config via properties
- **android/app/proguard-rules.pro**: Complete rules for Capacitor 8 + all plugins + app package
- **android/keystore.properties**: New file (gitignored) — keystore path, alias, passwords
- **android/keystore/README.md**: Documentation including generation, Play App Signing, versionCode scheme, backup
- **package.json**: `adConfig` admob IDs updated to production, `isTesting: false`
- **src/js/rewardService.js**: Ad IDs updated (compile-time constants via vite define), graceful ad failure handling
- **src/js/utils.js**: Haptic feedback wrapper, native share/file-picker wrappers, status bar style wrapper
- **src/js/pages/addPage.js**: Haptic feedback calls on keypad press
- **src/js/pages/settingsPage.js**: Haptic feedback toggle, native share/file-picker integration
- **src/js/main.js**: In-app review check on init
- **index.html**: `overscroll-behavior: none` CSS
- **android/keystore/**: New directory with keystore file (gitignored) and build docs including Play App Signing guide
- **capacitor.config.json**: Splash screen configuration for @capacitor/splash-screen
- **android/app/src/main/java/.../MainActivity.java**: WindowInsetsController for edge-to-edge fallback

