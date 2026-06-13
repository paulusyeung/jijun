## Phase 0: Pre-Launch Checklist (Developer Responsibility)

> **Note**: These items are not automated but must be completed before Play Store submission. Document in `android/keystore/README.md`.

- [ ] 0.1 Create Play Console project and configure app listing
- [ ] 0.2 Complete IARC questionnaire (Content Rating) in Play Console
- [ ] 0.3 Prepare app listing assets: screenshots (phone/tablet), feature graphic, short/long description
- [ ] 0.4 Configure Privacy Policy URL in Play Console (NOT in AndroidManifest.xml — AdMob meta-data only takes App ID)
- [ ] 0.5 Decide on app category and contact email

---

## Phase 1: Play Store Blockers (Tasks 1-7)

### 1. Add missing colors.xml — HIGHEST PRIORITY (build fails without this)

- [x] 1.1 Create `android/app/src/main/res/values/colors.xml` with `colorPrimary` (`#334A52`), `colorPrimaryDark` (`#1F2E33`), `colorAccent` (`#E2B67A`) matching the wabi theme palette
- [x] 1.2 Add `ic_launcher_background` color (`#FFFFFF`) to the same file (currently defined in standalone `values/ic_launcher_background.xml` AND `drawable/ic_launcher_background.xml` — consolidate)
- [x] 1.3 Remove duplicate `values/ic_launcher_background.xml` and `drawable/ic_launcher_background.xml` after consolidation
- [ ] 1.4 Verify `styles.xml` references resolve correctly by running `./gradlew assembleDebug` — **MUST PASS before proceeding**

### 2. Replace placeholder adaptive icon with branded vector

- [x] 2.1 Design a simplified accounting/abacus icon as an Android Vector Drawable for `ic_launcher_foreground.xml`
- [x] 2.2 Replace `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` with the branded vector
- [ ] 2.3 Verify the adaptive icon renders correctly on API 26+ emulator

### 3. Swap AdMob test IDs for production IDs (with graceful fallback)

- [ ] 3.1 Replace `AndroidManifest.xml` AdMob App ID with the production App ID **(requires actual AdMob production App ID)**
- [ ] 3.2 Update `package.json` -> `adConfig.admobBannerId` with production banner ad unit ID **(requires actual production ID)**
- [ ] 3.3 Update `package.json` -> `adConfig.admobRewardedId` with production rewarded ad unit ID **(requires actual production ID)**
- [x] 3.4 Set `package.json` -> `adConfig.isTesting` to `false`
- [ ] 3.5 Verify the vite build injects the new IDs into `rewardService.js` by checking the compiled output
- [x] 3.6 Add try/catch around ad initialization in `rewardService.js:_initAdMob()` to handle failures gracefully (network issues, unapproved account) — already partially done, ensure all paths covered
- [x] 3.7 Ensure `rewardService.js` shows no broken UI if ads fail: banner container stays empty, rewarded ad shows toast error, app continues functioning
- [ ] 3.8 Test with production IDs in a sandbox environment first; verify app functions without ads if they fail to load

### 4. Update versionCode and versionName

- [x] 4.1 Set `versionCode` in `android/app/build.gradle` to `2010506` (v2.1.5.6 → major*1000000 + minor*10000 + patch*100 + build)
- [x] 4.2 Set `versionName` in `android/app/build.gradle` to `"2.1.5.6"`

### 5. Generate app signing keystore and configure release signing (via properties file)

- [x] 5.1 Create `android/keystore/` directory and add to `.gitignore`
- [ ] 5.2 Generate a release keystore using `keytool -genkey -v -keystore release.keystore -alias easyaccounting -keyalg RSA -keysize 2048 -validity 10000`
- [ ] 5.3 Create `android/keystore.properties` with keystore path, alias, and passwords (gitignored)
- [x] 5.4 Add signing config to `android/app/build.gradle` referencing the properties file (NOT hardcoded passwords)
- [x] 5.5 Create `android/keystore/README.md` with backup instructions, Play App Signing recommendation, and example properties file

### 6. Enable ProGuard/R8 for release builds — COMPLETE RULES

- [ ] 6.1 Set `minifyEnabled true` in `android/app/build.gradle` release block
- [x] 6.2 Add ProGuard keep rules in `android/app/proguard-rules.pro`:
  - Keep all Capacitor bridge classes: `-keep class com.getcapacitor.** { *; }`
  - Keep Capacitor Bridge specifically: `-keep class com.getcapacitor.Bridge { *; }`
  - Keep all plugin classes: `-keep class com.google.** { *; }`, `-keep class com.codetrix.** { *; }`
  - Keep app package classes: `-keep class com.walkingfish.easyaccounting.** { *; }`
  - Keep Google Play Services: `-keep class com.google.android.gms.** { *; }`
  - Keep @capacitor-community/admob: `-keep class com.capacitorcommunity.admob.** { *; }`
  - Keep @capacitor/share: `-keep class com.capacitor.share.** { *; }`
  - Keep @capacitor/filesystem: `-keep class com.capacitor.filesystem.** { *; }`
  - Keep @capacitor/haptics: `-keep class com.capacitor.haptics.** { *; }`
  - Keep @capacitor/status-bar: `-keep class com.capacitor.statusbar.** { *; }`
  - Keep @capacitor/splash-screen: `-keep class com.capacitor.splashscreen.** { *; }`
  - Keep WebView JavaScriptInterface classes: `-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }`
  - Keep GSON/serialization (if used): `-keep class com.google.gson.** { *; }`
- [ ] 6.3 Build release APK and verify it runs on a physical device

### 7. Configure Privacy Policy URL in Play Console

- [ ] 7.1 Add Privacy Policy URL in Play Console → App content → Privacy policy (NOT in AndroidManifest.xml — AdMob meta-data only accepts App ID)
- [ ] 7.2 Verify the URL is accessible and contains required privacy information
- [x] 7.3 Ensure `AndroidManifest.xml` only has AdMob `APPLICATION_ID` meta-data (no privacy policy attribute)

---

## Phase 2: Release Quality Polish (Tasks 8-11)

### 8. Branded splash screen + dark mode support (migrate to @capacitor/splash-screen)

- [x] 8.1 Run `npm install @capacitor/splash-screen && npx cap sync android`
- [ ] 8.2 Replace `android/app/src/main/res/drawable/splash.png` with a branded splash asset (app logo + wabi background color) **(requires designer asset)**
- [ ] 8.3 Add `android/app/src/main/res/drawable-night/splash.png` for dark mode splash variant **(requires designer asset)**
- [x] 8.4 Update `styles.xml` -> `AppTheme.NoActionBarLaunch` to remove `android:background` and use Capacitor SplashScreen API
- [x] 8.5 Configure splash screen in `capacitor.config.json` (showDuration, backgroundColor, androidScaleType)
- [ ] 8.6 Verify splash displays correctly on both light and dark system themes

### 9. Edge-to-edge display handling (with bottom nav inset) — CSS + Java fallback

- [x] 9.1 Add `android:windowTranslucentStatus` and `android:windowTranslucentNavigation` handling or use `fitsSystemWindows="true"` properly
- [x] 9.2 Ensure the WebView content doesn't overlap with system bars on Android 10+ gesture navigation
- [x] 9.3 Add CSS `env(safe-area-inset-bottom)` padding to the custom bottom navigation bar in `main.css` (primary approach)
- [x] 9.4 Modify `MainActivity.java` to use `WindowInsetsController` for explicit inset handling (fallback for OEM devices)
- [ ] 9.5 Test on Pixel/stock Android with gesture navigation enabled AND Samsung/Xiaomi devices

### 10. Disable WebView overscroll glow

- [x] 10.1 Add `overscroll-behavior: none` to `body` in `index.html` or `src/css/main.css` to prevent the blue glow effect on Android WebView

### 11. Document versionCode scheme

- [x] 11.1 Define versionCode calculation in `android/keystore/README.md`: `versionCode = major*1000000 + minor*10000 + patch*100 + build`
- [x] 11.2 Example: v2.1.5.6 → 2010506, v2.1.5.7 → 2010507
- [x] 11.3 Update `android/app/build.gradle` versionCode to 2010506 (for v2.1.5.6)

---

## Phase 3: New Native Plugins (Tasks 12-17)

### 12. Install and integrate @capacitor/share

- [x] 12.1 Run `npm install @capacitor/share && npx cap sync android`
- [x] 12.2 Add a `nativeShare(data)` wrapper in `src/js/utils.js` that detects `Capacitor.isNativePlatform()` and calls `Share.share()`, falling back to `navigator.share` or clipboard copy on web
- [x] 12.3 Wire the export flow in `settingsPage.js` to use `nativeShare()` when sharing the app

### 13. Install and integrate @capacitor/filesystem

- [x] 13.1 Run `npm install @capacitor/filesystem && npx cap sync android`
- [x] 13.2 Add a `nativeFilePicker()` wrapper that uses `Filesystem.pickFile()` on native and falls back to `<input type="file">` on web
- [x] 13.3 Wire the import flow in `settingsPage.js` to use `nativeFilePicker()` for selecting import files
- [x] 13.4 Add `nativeSaveFile()` wrapper for export downloads using `Filesystem.writeFile()` on native

### 14. Install and integrate @capacitor/haptics

- [x] 14.1 Run `npm install @capacitor/haptics && npx cap sync android`
- [x] 14.2 Add haptic feedback setting to IndexedDB (`enableHapticFeedback`, default `true`)
- [x] 14.3 Add the setting toggle UI in `settingsPage.js` under "應用程式設定" (after "深色模式" toggle)
- [x] 14.4 Add `triggerHaptic()` wrapper in `src/js/utils.js` that checks the setting and calls `Haptics.vibrate()` on native, no-op on web (debounced ~50ms)
- [x] 14.5 Wire `triggerHaptic()` into the custom number keypad in `addPage.js` on every digit press and confirm/delete button
- [x] 14.6 Wire `triggerHaptic()` into bottom nav item clicks

### 15. Install and integrate capacitor-rate-app (in-app review) — with version tracking

- [x] 15.0 **VERIFY FIRST**: Check `capacitor-rate-app` npm page for Capacitor 8 compatibility — **INCOMPATIBLE** (requires @capacitor/core@^5.0.0). Using custom store link prompt instead.
- [ ] 15.1 Run `npm install capacitor-rate-app && npx cap sync android` **(skipped — incompatible with Capacitor 8)**
- [x] 15.2 Add review tracking in IndexedDB: `lastReviewPromptVersion`, `recordCountAtLastPrompt`
- [x] 15.3 In `main.js` -> new `checkReviewPrompt()` method: if records >= 30 AND days since app first launch >= 7 AND never prompted (or prompted on older major version), show review prompt
- [x] 15.4 Ensure the prompt fires once per major version (track in IndexedDB) to capture feedback after updates
- [x] 15.5 If plugin incompatible: implement custom store-link prompt (native navigation to Play Store listing)

### 16. Install and integrate @capacitor/status-bar

- [x] 16.1 Run `npm install @capacitor/status-bar && npx cap sync android`
- [x] 16.2 Add a `setStatusBarStyle(isDark)` wrapper in `src/js/utils.js`
- [x] 16.3 Wire into theme switches in `themeManager.js` — when dark theme is applied, set status bar to dark icons on dark background; when light, set light icons on light background

---

## Phase 4: Verification (Tasks 17-18)

### 17. Build verification (AAB format)

- [x] 17.1 Run `npm run lint` — no new warnings in modified files (pre-existing warnings/errors in dist/ and third-party code)
- [ ] 17.2 Run `npm test` — confirm all existing unit tests pass
- [x] 17.3 Run `npx cap sync android` — confirm no plugin sync errors
- [ ] 17.4 Run `cd android && ./gradlew bundleRelease` — confirm successful AAB build **(requires Android SDK + keystore)**
- [ ] 17.5 Run `cd android && ./gradlew assembleRelease` — confirm APK still builds for local testing **(requires Android SDK)**
- [ ] 17.6 Verify the release APK/AAB size is reasonable (with ProGuard enabled)
- [ ] 17.7 If using `bundletool`, convert AAB to APK for local device testing

### 18. Device testing

- [ ] 18.1 Install release APK on physical Android device (API 29+)
- [ ] 18.2 Verify app launches without crash
- [ ] 18.3 Verify branded splash screen displays on cold start **(requires branded splash assets from designer)**
- [ ] 18.4 Verify adaptive icon shows correctly in launcher
- [ ] 18.5 Verify keypad haptic feedback works (if enabled in settings)
- [ ] 18.6 Verify share sheet opens when sharing app from settings
- [ ] 18.7 Verify native file picker opens when importing data
- [ ] 18.8 Verify status bar colors adapt when switching dark/light themes
- [ ] 18.9 Verify no content overlap with gesture navigation bar (especially bottom nav)
- [ ] 18.10 Verify in-app review prompt does not appear on fresh install (waits for 30 records / 7 days)
- [ ] 18.11 Verify app functions correctly if ads fail to load (graceful degradation)
- [ ] 18.12 Test on multiple device types if possible (Pixel, Samsung, Xiaomi) for edge-to-edge
