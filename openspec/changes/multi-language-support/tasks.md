## Phase 1: Foundation (v1 - English + Traditional Chinese)

### 1. Install Dependencies

- [x] 1.1 Run `npm install i18next i18next-browser-languagedetector` to add dependencies

### 2. Create i18n Engine

- [x] 2.1 Create `src/js/i18n.js` with i18next initialization (fallback `'en'`, detection: localStorage → navigator.language)
- [x] 2.2 Export `t()` function wrapping `i18next.t()` with namespace support
- [x] 2.3 Export `changeLanguage(lng)` and `getCurrentLanguage()` helpers
- [x] 2.4 Wire `languageChanged` event: update `<html lang>`, dispatch custom event, **trigger full page reload** (`location.reload()`)
- [x] 2.5 Initialize i18n engine in `main.js:init()` before page rendering
- [x] 2.6 Vite automatically copies `public/locales/` — confirmed in build output

### 3. Create Translation JSON Files — Common (en + zh-TW only)

- [x] 3.1 Create `public/locales/en/common.json` (nav labels, buttons, toasts, modals — ~80 keys)
- [x] 3.2 Create `public/locales/zh-TW/common.json`
- [x] 3.3 Create `public/locales/en/categories.json` (16 category name keys)
- [x] 3.4 Create `public/locales/zh-TW/categories.json`
- [x] 3.5 Create `public/locales/en/errors.json` (validation and error messages — ~10 keys)
- [x] 3.6 Create `public/locales/zh-TW/errors.json`

### 4. Create Translation JSON Files — Pages (en + zh-TW only)

- [x] 4.1 Create `public/locales/en/home.json` (~70 keys, updated estimate)
- [x] 4.2 Create `public/locales/zh-TW/home.json`
- [x] 4.3 Create `public/locales/en/add.json` (~65 keys)
- [x] 4.4 Create `public/locales/zh-TW/add.json`
- [x] 4.5 Create `public/locales/en/settings.json` (~83 keys)
- [x] 4.6 Create `public/locales/zh-TW/settings.json`
- [x] 4.7 Create `public/locales/en/records.json` (~11 keys)
- [x] 4.8 Create `public/locales/zh-TW/records.json`
- [x] 4.9 Create `public/locales/en/stats.json` (~1 key)
- [x] 4.10 Create `public/locales/zh-TW/stats.json`
- [x] 4.11 Create `public/locales/en/ledger.json` (~84 keys)
- [x] 4.12 Create `public/locales/zh-TW/ledger.json`
- [x] 4.13 Create `public/locales/en/accounts.json` (~37 keys)
- [x] 4.14 Create `public/locales/zh-TW/accounts.json`
- [x] 4.15 Create `public/locales/en/debts.json` (~83 keys)
- [x] 4.16 Create `public/locales/zh-TW/debts.json`
- [x] 4.17 Create `public/locales/en/recurring.json` (~34 keys)
- [x] 4.18 Create `public/locales/zh-TW/recurring.json`
- [x] 4.19 Create `public/locales/en/amortizations.json` (~22 keys)
- [x] 4.20 Create `public/locales/zh-TW/amortizations.json`
- [x] 4.21 Create `public/locales/en/plugins.json` (~38 keys)
- [x] 4.22 Create `public/locales/zh-TW/plugins.json`
- [x] 4.23 Create `public/locales/en/sync.json` (~44 keys)
- [x] 4.24 Create `public/locales/zh-TW/sync.json`

### 5. Refactor Page Components — Core Pages

- [x] 5.1 `homePage.js` — Replace all Chinese strings with `t('home.*')` calls (~70 replacements)
- [x] 5.2 `addPage.js` — Replace all Chinese strings with `t('add.*')` calls (~153 replacements)
- [x] 5.3 `settingsPage.js` — Replace all Chinese strings with `t('settings.*')` calls (~80 replacements)
- [x] 5.4 `recordsPage.js` — Replace Chinese strings with `t('records.*')` calls (~12 replacements)
- [x] 5.5 `statsPage.js` — Replace Chinese strings with `t('stats.*')` calls (~1 replacement)

### 6. Refactor Page Components — Feature Pages

- [x] 6.1 `ledgersPage.js` — Replace Chinese strings with `t('ledger.*')` calls (~50 replacements)
- [x] 6.2 `accountsPage.js` — Replace Chinese strings with `t('accounts.*')` calls (~36 replacements)
- [x] 6.3 `recurringPage.js` — Replace Chinese strings with `t('recurring.*')` calls (~22 replacements)
- [x] 6.4 `amortizationsPage.js` — Replace Chinese strings with `t('amortizations.*')` calls (~21 replacements)
- [x] 6.5 `pluginsPage.js` and `storePage.js` — Replace Chinese strings with `t('plugins.*')` calls (~27 replacements)
- [x] 6.6 `themesPage.js` and `themeStorePage.js` — Replace Chinese strings with `t('plugins.*')` calls (~27 replacements)
- [x] 6.7 `syncSettingsPage.js` — Replace Chinese strings with `t('sync.*')` calls (~45 replacements)
- [x] 6.8 `privacyPage.js` — Replace hardcoded Chinese prose with `t('common:privacy.*')` calls (inline, ~16 replacements)
- [x] 6.9 `licensePage.js` — Replace Chinese strings with `t('common:license.*')` calls (~20 replacements)

### 7. Refactor Utility and Manager Modules

- [x] 7.1 `categories.js` — Add `nameKey` property to all 16 category definitions
- [x] 7.2 `categoryManager.js` — No changes needed (getCategoryName handled in categories.js)
- [x] 7.3 `debtManager.js` — Replace Chinese strings with `t('debts.*')` calls (~50 replacements)
- [x] 7.4 `budgetManager.js` — Replace Chinese strings with `t('common.*')` and `t('home:budget.*')` calls (~20 replacements)
- [x] 7.5 `recordsList.js` — Replace Chinese strings in category and account filter modals (~23 replacements)
- [x] 7.6 `statistics.js` — Replace any hardcoded Chinese strings with `t('stats.*')` (~16 replacements)
- [x] 7.7 `rewardService.js` — Replace Chinese strings with `t('common:ad.*')` calls (~15 replacements)
- [x] 7.8 `pluginManager.js` — Replace Chinese permission labels with `t('plugins.*')` (~18 replacements)
- [x] 7.9 `syncService.js` — Replace Chinese confirm dialogs with `t('sync.*')` (~12 replacements)
- [x] 7.10 `router.js` — Replace Chinese error text with `t('errors.*')` (~2 replacements)
- [x] 7.11 `main.js` — Replace Chinese strings with `t('common.*')` (~8 replacements)
- [x] 7.12 `notificationService.js` — Replace any Chinese strings with `t('common:notification.*')` (~4 replacements)

### 8. Fix Locale Formatting

- [x] 8.1 `utils.js` — Replace hardcoded `'zh-TW'` in `Intl.NumberFormat` with `_resolveLocale()` helper via `getCurrentLanguage()`
- [x] 8.2 `utils.js` — Replace hardcoded `'zh-TW'` in `toLocaleDateString()` with `_resolveLocale()`
- [x] 8.3 `statistics.js` — No hardcoded `'zh-TW'` locale strings found; `zhTW` date-fns import is a date-fns locale object (not a JS locale string), left as-is
- [x] 8.4 Verified decimal, currency, and date formatting uses `getCurrentLanguage()` properly mapped to en-US/zh-TW

### 9. Add Language Switcher UI

- [x] 9.1 Add language selector `<select>` to Settings page "應用程式" section (with globe icon, language label, and subtitle)
- [x] 9.2 Wire language change: `changeLanguage()` persistence → `location.reload()` — full page reload on switch
- [x] 9.3 Language preference persisted via localStorage `i18nextLng` key — survives navigations and restarts

### 10. Fix index.html and Static Content

- [x] 10.1 Replace hardcoded Chinese nav labels, sidebar text, and footer in `index.html` with `data-i18n` attributes (translated by JS at runtime)
- [x] 10.2 Update `<html lang="zh-TW">` to be dynamically set by i18next on language change

### 11. Build-time Validation Script

- [x] 11.1 Create `scripts/validate-translations.mjs` that:
  - Greps all `t('namespace:key')` calls in source files (`src/`)
  - Cross-references against keys in `public/locales/en/*.json` and `public/locales/zh-TW/*.json`
  - Handles nested keys (JSON key depth) and dynamic key patterns (e.g. `day0`..`day6`)
  - Warns on unused keys, errors on missing keys; exits with code 1 on error
- [x] 11.2 Added to package.json as `npm run validate:i18n` (also run manually)

### 12. Verification (v1)

- [x] 12.1 Run `npm run lint` — no new warnings from i18n changes (pre-existing warnings only)
- [x] 12.2 Run `npm run build` — build succeeds, locales confirmed in `dist/locales/en/` and `dist/locales/zh-TW/`
- [ ] 12.3 Set browser language to `en-US` — confirm app renders in English on first visit *(manual)*
- [ ] 12.4 Switch language via Settings to `zh-TW` — confirm all UI switches to Traditional Chinese *(manual)*
- [ ] 12.5 Verify currency formatting: `$1,234.50` (en) vs `$1,234.50` (zh-TW) *(manual)*
- [ ] 12.6 Verify date formatting: `January 2025` (en) vs `2025年1月` (zh-TW) *(manual)*
- [ ] 12.7 Verify all 16 category names display correctly in both languages *(manual)*
- [ ] 12.8 Verify all pages render without missing-key indicators *(manual)*
- [ ] 12.9 Verify language preference persists after closing and reopening the app *(manual)*
- [ ] 12.10 Verify privacy page loads correct language version *(manual)*
- [x] 12.11 Run `scripts/validate-translations.mjs` — ✅ all keys present with zero errors

---

## Phase 2: Simplified Chinese + Client-side Re-render (v2)

### 13. Add Simplified Chinese Translations

- [x] 13.1 Create all `public/locales/zh-CN/*.json` files (15 files via opencc-js conversion from zh-TW)
- [x] 13.2 Update i18next config to include `zh-CN` in supported languages + convertDetectedLanguage mapping
- [x] 13.3 Update language selector UI to include Simplified Chinese option (3 options in settings)
- [x] 13.4 Fix hardcoded locale ternaries in `amortizationsPage.js` and `syncSettingsPage.js` to handle zh-CN
- [ ] 13.5 Verify all pages render correctly in Simplified Chinese *(manual)*

### 14. Client-side Re-render

- [x] 14.1 Replace full page reload with client-side re-render on language switch
- [x] 14.2 Add `router.reRender()` method that re-executes the current route's render function
- [x] 14.3 Handle state preservation during re-render (open modals, form data) — closes modals/popups, restores scroll position
- [ ] 14.4 Test re-render works correctly across all pages *(manual — verify no page flash on language switch)*

### 15. Enhanced Validation

- [x] 15.1 Expand validation script to catch missing interpolations — detects `{{var}}` placeholders in translations vs variable names passed in `t()` calls
- [x] 15.2 Add translation completeness report (percentage of keys translated per language) — reports zh-TW and zh-CN completeness vs English
- [x] 15.3 Integrate into CI pipeline — validation runs as part of `npm run build` (`node scripts/validate-translations.mjs && vite build`)

### 16. Verification (v2)

- [ ] 16.1 Switch language via Settings to `zh-CN` — confirm all UI switches to Simplified Chinese *(manual)*
- [ ] 16.2 Verify currency formatting: `¥1,234.50` (zh-CN) *(manual)*
- [ ] 16.3 Verify date formatting: `2025年1月` (zh-CN) *(manual)*
- [ ] 16.4 Verify all 16 category names display correctly in Simplified Chinese *(manual)*
- [ ] 16.5 Verify client-side re-render works without page flash *(manual)*
- [x] 16.6 Run enhanced validation — `npm run validate:i18n` passes with 0 errors, completeness report shows 100% for both zh-TW and zh-CN