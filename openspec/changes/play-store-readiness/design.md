## Context

The app is a PWA wrapped in Capacitor for Android distribution. The Android project was scaffolded by `capacitor init` and has not been customized for production release. It ships with:

- A placeholder adaptive icon (Android Studio default smiley face foreground)
- **Missing `colors.xml` — `styles.xml:7-9` references `@color/colorPrimary`, `@color/colorPrimaryDark`, `@color/colorAccent` which do not exist. Build fails immediately.**
- Test AdMob IDs (both banner and rewarded) in both `AndroidManifest.xml` and `package.json`
- `versionCode = 1`, `versionName = "1.0"` — the JS app is at v2.1.5.6
- ProGuard/R8 disabled (`minifyEnabled false`)
- Default Capacitor splash screen (legacy `Theme.SplashScreen` approach)
- No app signing configuration
- Three Capacitor plugins already installed (AdMob, Local Notifications, Google Auth)
- No Privacy Policy URL in Play Console (Play Store requirement — not in manifest)
- Build target is APK (`assembleRelease`) but Play Store requires AAB (`bundleRelease`)

The JS layer also has gaps: data export uses browser download (no native file picker), no share sheet, and the custom number keypad has no haptic feedback.

## Goals / Non-Goals

**Goals:**
- Fix all build-blocking issues in the Android project so a signed release AAB can be produced
- Replace all placeholder/test branding and ad IDs with production values
- Enable APK/AAB shrinking and obfuscation for release builds
- Provide a more native feel via haptics, share sheet, and native file picker
- Add in-app review prompts to grow Play Store ratings (with periodic re-prompt per version)
- Ensure the app looks correct on edge-to-edge displays (Android 10+) including bottom nav inset handling
- Add dark mode support to the splash screen
- Configure keystore via properties file (not hardcoded in build.gradle)
- Document Play App Signing recommendation and privacy policy requirements

**Non-Goals:**
- Rewriting any existing JS page logic or UI framework
- Migrating away from Capacitor to another hybrid framework
- Adding iOS support (out of scope — Android only)
- Adding new analytics or crash reporting (requires Firebase project setup — separate effort)
- Changing the app's theming system or CSS architecture
- Refactoring the plugin system or data layer
- Creating Play Console account or completing IARC questionnaire (developer responsibility, documented in checklist)

## Decisions

### Decision 1: Static colors.xml with wabi theme values
**Choice:** Define `colorPrimary`, `colorPrimaryDark`, `colorAccent` in `colors.xml` using the wabi theme's primary color (`#334A52`) and accents (`#E2B67A`).
**Rationale:** The `styles.xml` already references these color resources. Without them, the build fails. Using the wabi palette ensures consistency with the app's design.
**Trade-off:** These values are duplicated from the JS theme constants. Acceptable — they only apply during the splash screen and task switcher, not the app UI itself.

### Decision 2: Custom adaptive icon — simple branded vector
**Choice:** Create a new `ic_launcher_foreground.xml` vector depicting a simplified abacus/money icon (matching the app's purpose) in the wabi primary color on a white background.
**Rationale:** The current foreground is the Android Studio default smiley face. A custom icon is required for Play Store listing.
**Trade-off:** A simple vector icon is not as polished as a professional designer's work, but it's a vast improvement over the placeholder and can be refined later.

### Decision 3: ProGuard rules for WebView JS bridge
**Choice:** Add ProGuard keep rules for any classes accessed from JavaScript via Capacitor's WebView bridge, and enable `minifyEnabled true`.
**Rationale:** Without minification, the release APK is unnecessarily large. The Capacitor bridge and plugin classes must be preserved to avoid runtime crashes.
**Trade-off:** Build time increases slightly. Initial release may need additional ProGuard rules discovered through testing. **Rollback**: Set `minifyEnabled false` if release build crashes.

### Decision 4: Feature-flag haptic feedback
**Choice:** Add a user setting `enableHapticFeedback` (default: `true`) in IndexedDB that controls whether keypad presses trigger haptic feedback.
**Rationale:** Haptic feedback can be annoying to some users. A simple toggle respects user preference without needing a full settings page redesign — it fits in the existing settings.
**Trade-off:** Requires reading a setting on every keypress. Mitigation: cache the value in memory after initialization.

### Decision 5: Native file picker as progressive enhancement
**Choice:** Use `@capacitor/filesystem` when running natively, falling back to the existing browser `<input type="file">` / download approach on the web.
**Rationale:** The existing import/export logic works on web. Adding native file picker improves the Android UX without breaking the PWA deployment.
**Trade-off:** Dual code paths for export/import. Mitigation: wrap in a `isNative` check, keep the web path unchanged.

### Decision 6: Usage-based in-app review trigger with periodic re-prompt
**Choice:** Prompt for Play Store review after the user has created 30 records AND been active for at least 7 days. Use `capacitor-rate-app` (or verified alternative) for the native dialog. Re-prompt once per major version update to capture new user feedback.
**Rationale:** A fixed threshold avoids spamming. The 30-record / 7-day criteria filters out casual testers and targets engaged users. Periodic re-prompting aligns with Google's own guidelines.
**Trade-off:** Some users may find any prompt intrusive. Mitigation: only prompt once per major version, track in IndexedDB.

### Decision 7: Keystore via properties file (not hardcoded)
**Choice:** Store keystore path, alias, and passwords in `android/keystore.properties` (gitignored) and reference from `build.gradle`.
**Rationale:** Hardcoding passwords in `build.gradle` is a security risk and pollutes version control. Properties file is the Android standard pattern.
**Trade-off:** Requires an extra step during initial setup. Mitigation: Document clearly in `android/keystore/README.md` with example properties file.

### Decision 8: AAB as primary build target
**Choice:** Use `bundleRelease` (Android App Bundle) as the primary build target instead of `assembleRelease` (APK).
**Rationale:** Play Store now requires AAB format. APK builds are only for local testing/sideloading.
**Trade-off:** AAB cannot be directly installed on devices — requires Play Store internal testing track or `bundletool` for local testing.

### Decision 9: Graceful ad failure handling
**Choice:** Ensure the app continues to function normally if AdMob ads fail to load (network issues, account not yet approved, region restrictions).
**Rationale:** New AdMob accounts can take days/weeks to approve. Users in regions without ad support should not see broken UI.
**Trade-off:** Slightly more complex error handling in `rewardService.js`. Mitigation: Add try/catch around ad initialization and log warnings without crashing.

### Decision 10: Edge-to-edge with explicit bottom nav inset handling
**Choice:** Handle window insets explicitly for the custom bottom navigation bar, using both CSS `env(safe-area-inset-bottom)` AND Java/Kotlin `WindowInsetsController` in `MainActivity.java` as fallback.
**Rationale:** The bottom nav bar is custom HTML/CSS (`index.html:77-123`) and won't automatically respect system insets. Without explicit handling, it will overlap the gesture navigation area on Android 10+. CSS alone may be insufficient on some OEM devices (Samsung, Xiaomi).
**Trade-off:** Requires modifying `MainActivity.java`. Mitigation: Implement CSS first, add Java fallback if testing reveals gaps.

### Decision 11: ProGuard rules completeness for Capacitor 8
**Choice:** Extend ProGuard rules beyond the baseline to include: Capacitor bridge internals, `@JavascriptInterface` methods, app package classes, Google Play Services, and `@capacitor-community/admob` classes.
**Rationale:** The baseline rules (`com.getcapacitor.**`, `com.google.**`, `com.codetrix.**`) are insufficient for Capacitor 8. Missing rules cause `ClassNotFoundException` or `NoSuchMethodError` at runtime in release builds.
**Trade-off:** More rules = larger APK, but correctness is paramount. Test release build on device after enabling `minifyEnabled true`.

### Decision 12: versionCode monotonic scheme
**Choice:** Use semantic versioning mapped to integer: `versionCode = major*1000000 + minor*10000 + patch*100 + build`. Example: v2.1.5.6 → 2010506.
**Rationale:** Ensures monotonic increases, avoids collisions, and is human-readable. Document in `android/keystore/README.md`.
**Trade-off:** None — standard Android practice.

### Decision 13: Privacy Policy URL location
**Choice:** Configure Privacy Policy URL in Play Console (App content → Privacy policy), NOT in `AndroidManifest.xml`. AdMob meta-data only takes App ID.
**Rationale:** Play Store requires privacy policy URL in Console listing. Manifest has no standard attribute for this. AdMob's `APPLICATION_ID` meta-data is for AdMob account linking only.
**Trade-off:** Developer must manually enter URL in Play Console before submission. Document in checklist.

### Decision 14: capacitor-rate-app compatibility verification
**Choice:** Verify `capacitor-rate-app` compatibility with Capacitor 8 (`@capacitor/core@^8.2.0`) before implementation. If incompatible, implement Play Review API directly via custom Capacitor plugin wrapper.
**Rationale:** Many community plugins lag behind Capacitor major versions. The design already notes this risk (Decision 6 trade-off).
**Trade-off:** Custom wrapper requires more code but guarantees compatibility. Decision point at Task 14.1.

### Decision 15: Splash screen — migrate to @capacitor/splash-screen
**Choice:** Replace legacy `Theme.SplashScreen` approach with `@capacitor/splash-screen` plugin for proper dark mode support and future compatibility.
**Rationale:** Current `styles.xml:22-24` uses deprecated Capacitor splash approach. The plugin provides programmatic control, dark mode assets, and works with Capacitor 8+.
**Trade-off:** Additional plugin dependency. Minimal — plugin is lightweight and maintained by Capacitor team.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Missing colors.xml** | Build fails immediately | Task 1.1 is highest priority. Verify `./gradlew assembleDebug` passes before proceeding. |
| **ProGuard over-minification** | App crashes on startup in release mode | Test release builds thoroughly on physical device. Add keep rules proactively for ALL Capacitor plugin classes (including `@capacitor-community/admob`, `@capacitor/share`, `@capacitor/filesystem`, `@capacitor/haptics`, `@capacitor/status-bar`). Rollback: `minifyEnabled false`. |
| **capacitor-rate-app compatibility** | Plugin may be outdated/incompatible with Capacitor 8 | Verify plugin maintenance status before implementation (Task 14.1). Have fallback: use Play Review API directly via custom Capacitor plugin if needed. |
| **Haptic battery drain** | Negligible but possible user complaint | Short vibration (~20ms), minimal impact. Default to `true` but allow disabling. |
| **In-app review API rate-limiting** | Dialog may not show even when triggered | Plugin handles gracefully — best effort prompt with no guarantee of display. |
| **Keystore loss** | App cannot be updated on Play Store | Use Play App Signing (Google manages the upload key). Document keystore backup steps prominently. |
| **AdMob account approval delay** | Ads won't show at launch | Graceful fallback: app functions without ads. Test with test IDs until approved. |
| **Edge-to-edge CSS limitations** | Bottom nav may still overlap on some devices | Implement BOTH CSS (`env(safe-area-inset-bottom)`) AND Java `WindowInsetsController` fallback in `MainActivity.java`. Test on multiple device types (Pixel, Samsung, Xiaomi). |
| **capacitor-rate-app unmaintained** | Cannot integrate in-app review | Fallback: implement Play Review API directly via custom Capacitor plugin (documented in Decision 6 trade-off). |
| **Privacy Policy URL missing in Play Console** | Play Store rejection | Checklist item 0.4 — must complete before submission. Not a code change. |

## Rollback Plan

| Component | Rollback Strategy | Trigger Condition |
|-----------|-------------------|-------------------|
| ProGuard/r8 | Set `minifyEnabled false` and revert `proguard-rules.pro` | Release build crashes on device |
| New plugins | Revert `capacitor.settings.gradle`, `capacitor.build.gradle`, remove plugin imports from JS | Plugin crashes or breaks existing functionality |
| Haptic feedback | Disable `enableHapticFeedback` setting — no code change needed | User reports annoyance |
| In-app review | Clear `lastReviewPromptDate` from IndexedDB — effectively resets | Negative user feedback or Play Store policy change |
| AdMob production IDs | Revert to test IDs in `package.json` and `AndroidManifest.xml` | Ads cause crashes or account issues |
| Edge-to-edge | Remove inset handling, revert to default system bars | Content overlap or visual bugs on specific devices |
| @capacitor/splash-screen | Revert `styles.xml` to `Theme.SplashScreen` + `@drawable/splash` | Plugin causes issues or dark mode splash fails |
| capacitor-rate-app | Remove plugin, clear review tracking from IndexedDB | Plugin incompatible or causes crashes |

## Testing Strategy

- **Unit tests**: Existing vitest suite continues to pass after JS changes (haptic utility, share integration)
- **Build verification**: 
  - `cd android && ./gradlew assembleDebug` succeeds (validates colors.xml, resources)
  - `cd android && ./gradlew bundleRelease` succeeds (AAB format, ProGuard enabled)
- **Device testing**: Install release APK on physical Android device (API 29+), verify:
  - App launches without crash
  - Splash screen displays branded asset (light + dark mode)
  - App icon appears correctly in launcher (adaptive icon on API 26+, fallback on older)
  - Keypad press produces haptic feedback (if enabled)
  - Share sheet opens when exporting data
  - Native file picker opens when importing data
  - AdMob banners load (test with production IDs in a sandbox environment first)
  - App functions correctly if ads fail to load (graceful degradation)
- **Edge-to-edge**: Verify content doesn't overlap navigation bar or status bar on devices with gesture navigation (Pixel, Samsung, Xiaomi). Pay special attention to bottom nav bar — test with gesture navigation enabled.
- **Dark mode**: Enable system dark mode, verify splash screen background adapts correctly, status bar icons adapt (via `@capacitor/status-bar`)
- **ProGuard validation**: Run release build through `apkanalyzer` or similar tool to verify no critical classes were stripped
- **Version alignment**: Verify `versionName` matches `package.json` (2.1.5.6) and `versionCode` follows monotonic scheme
- **AAB local testing**: Use `bundletool` to generate APKs from AAB for device testing: `java -jar bundletool.jar build-apks --bundle=app.aab --output=test.apks --connected-device`
