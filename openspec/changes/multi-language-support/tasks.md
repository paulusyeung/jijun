## Phase 1: Foundation (v1 - English + Traditional Chinese)

### 1. Install Dependencies

- [ ] 1.1 Run `npm install i18next i18next-browser-languagedetector` to add dependencies

### 2. Create i18n Engine

- [ ] 2.1 Create `src/js/i18n.js` with i18next initialization (fallback `'en'`, detection: localStorage → navigator.language)
- [ ] 2.2 Export `t()` function wrapping `i18next.t()` with namespace support
- [ ] 2.3 Export `changeLanguage(lng)` and `getCurrentLanguage()` helpers
- [ ] 2.4 Wire `languageChanged` event: update `<html lang>`, dispatch custom event, **trigger full page reload** (`location.reload()`)
- [ ] 2.5 Initialize i18n engine in `main.js:init()` before page rendering
- [ ] 2.6 Update `vite.config.js` to copy `public/locales/` to build output

### 3. Create Translation JSON Files — Common (en + zh-TW only)

- [ ] 3.1 Create `public/locales/en/common.json` (nav labels, buttons, toasts, modals — ~80 keys)
- [ ] 3.2 Create `public/locales/zh-TW/common.json`
- [ ] 3.3 Create `public/locales/en/categories.json` (16 category name keys)
- [ ] 3.4 Create `public/locales/zh-TW/categories.json`
- [ ] 3.5 Create `public/locales/en/errors.json` (validation and error messages — ~10 keys)
- [ ] 3.6 Create `public/locales/zh-TW/errors.json`

### 4. Create Translation JSON Files — Pages (en + zh-TW only)

- [ ] 4.1 Create `public/locales/en/home.json` (~70 keys, updated estimate)
- [ ] 4.2 Create `public/locales/zh-TW/home.json`
- [ ] 4.3 Create `public/locales/en/add.json` (~120 keys, updated estimate)
- [ ] 4.4 Create `public/locales/zh-TW/add.json`
- [ ] 4.5 Create `public/locales/en/settings.json` (~130 keys, updated estimate)
- [ ] 4.6 Create `public/locales/zh-TW/settings.json`
- [ ] 4.7 Create `public/locales/en/records.json` (~30 keys, updated estimate)
- [ ] 4.8 Create `public/locales/zh-TW/records.json`
- [ ] 4.9 Create `public/locales/en/stats.json` (~10 keys, updated estimate)
- [ ] 4.10 Create `public/locales/zh-TW/stats.json`
- [ ] 4.11 Create `public/locales/en/ledger.json` (~100 keys, updated estimate)
- [ ] 4.12 Create `public/locales/zh-TW/ledger.json`
- [ ] 4.13 Create `public/locales/en/accounts.json` (~60 keys, updated estimate)
- [ ] 4.14 Create `public/locales/zh-TW/accounts.json`
- [ ] 4.15 Create `public/locales/en/debts.json` (~45 keys, updated estimate)
- [ ] 4.16 Create `public/locales/zh-TW/debts.json`
- [ ] 4.17 Create `public/locales/en/recurring.json` (~45 keys, updated estimate)
- [ ] 4.18 Create `public/locales/zh-TW/recurring.json`
- [ ] 4.19 Create `public/locales/en/amortizations.json` (~45 keys, updated estimate)
- [ ] 4.20 Create `public/locales/zh-TW/amortizations.json`
- [ ] 4.21 Create `public/locales/en/plugins.json` (~30 keys, updated estimate)
- [ ] 4.22 Create `public/locales/zh-TW/plugins.json`
- [ ] 4.23 Create `public/locales/en/sync.json` (~75 keys, updated estimate)
- [ ] 4.24 Create `public/locales/zh-TW/sync.json`

### 5. Refactor Page Components — Core Pages

- [ ] 5.1 `homePage.js` — Replace all Chinese strings with `t('home.*')` calls (~70 replacements)
- [ ] 5.2 `addPage.js` — Replace all Chinese strings with `t('add.*')` calls (~120 replacements)
- [ ] 5.3 `settingsPage.js` — Replace all Chinese strings with `t('settings.*')` calls (~130 replacements)
- [ ] 5.4 `recordsPage.js` — Replace Chinese strings with `t('records.*')` calls (~30 replacements)
- [ ] 5.5 `statsPage.js` — Replace Chinese strings with `t('stats.*')` calls (~10 replacements)

### 6. Refactor Page Components — Feature Pages

- [ ] 6.1 `ledgersPage.js` — Replace Chinese strings with `t('ledger.*')` calls (~100 replacements)
- [ ] 6.2 `accountsPage.js` — Replace Chinese strings with `t('accounts.*')` calls (~60 replacements)
- [ ] 6.3 `recurringPage.js` — Replace Chinese strings with `t('recurring.*')` calls (~45 replacements)
- [ ] 6.4 `amortizationsPage.js` — Replace Chinese strings with `t('amortizations.*')` calls (~45 replacements)
- [ ] 6.5 `pluginsPage.js` and `storePage.js` — Replace Chinese strings with `t('plugins.*')` calls (~30 replacements)
- [ ] 6.6 `themesPage.js` and `themeStorePage.js` — Replace Chinese strings with `t('plugins.*')` calls (~30 replacements)
- [ ] 6.7 `syncSettingsPage.js` — Replace Chinese strings with `t('sync.*')` calls (~75 replacements)
- [ ] 6.8 `privacyPage.js` — Replace hardcoded Chinese prose with `fetch('/locales/{lang}/privacy.html')` loading
- [ ] 6.9 `licensePage.js` — Replace Chinese strings with `t('common.*')` calls

### 7. Refactor Utility and Manager Modules

- [ ] 7.1 `categories.js` — Add `nameKey` property to all 16 category definitions
- [ ] 7.2 `categoryManager.js` — Add `getCategoryName(cat)` helper using `t()`
- [ ] 7.3 `debtManager.js` — Replace Chinese strings with `t('debts.*')` calls (~45 replacements)
- [ ] 7.4 `budgetManager.js` — Replace Chinese strings with `t('common.*')` and `t('home.*')` (~40 replacements)
- [ ] 7.5 `recordsList.js` — Replace Chinese strings in category and account filter modals
- [ ] 7.6 `statistics.js` — Replace any hardcoded Chinese strings with `t('stats.*')`
- [ ] 7.7 `rewardService.js` — Replace Chinese strings with `t('common.*')` calls (~25 replacements)
- [ ] 7.8 `pluginManager.js` — Replace Chinese permission labels with `t('plugins.*')` (~10 replacements)
- [ ] 7.9 `syncService.js` — Replace Chinese confirm dialogs with `t('sync.*')` (~3 replacements)
- [ ] 7.10 `router.js` — Replace Chinese error text with `t('errors.*')` (~2 replacements)
- [ ] 7.11 `main.js` — Replace Chinese ledger placeholder text with `t('common.*')`
- [ ] 7.12 `notificationService.js` — Replace any Chinese strings with `t('common.*')`

### 8. Fix Locale Formatting

- [ ] 8.1 `utils.js` — Replace hardcoded `'zh-TW'` in `Intl.NumberFormat` with dynamic `i18next.language`
- [ ] 8.2 `utils.js` — Replace hardcoded `'zh-TW'` in `toLocaleDateString()` with dynamic locale
- [ ] 8.3 `statistics.js` — Replace hardcoded `'zh-TW'` in date-fns locale import with dynamic locale
- [ ] 8.4 Verify decimal, currency, and date formatting works correctly for both locales (en, zh-TW)

### 9. Add Language Switcher UI

- [ ] 9.1 Add language selector `<select>` to Settings page in the "應用程式" section
- [ ] 9.2 Wire language change: call `changeLanguage()`, persist selection, **trigger full page reload**
- [ ] 9.3 Test language persistence across page navigations and browser restarts

### 10. Fix index.html and Static Content

- [ ] 10.1 Replace hardcoded Chinese nav labels, sidebar text, and footer in `index.html` with dynamic `t()` calls
- [ ] 10.2 Update `<html lang="zh-TW">` to be dynamically set by i18next on language change

### 11. Build-time Validation Script

- [ ] 11.1 Create `scripts/validate-translations.js` that:
  - Greps all `t('namespace:key')` calls in source files
  - Cross-references against keys in `public/locales/en/*.json` and `public/locales/zh-TW/*.json`
  - Fails if any key is missing
- [ ] 11.2 Integrate validation into `npm run build` or CI pipeline

### 12. Verification (v1)

- [ ] 12.1 Run `npm run lint` — confirm no new warnings
- [ ] 12.2 Run `npm run build` — confirm build succeeds and locales are copied to `dist/locales/`
- [ ] 12.3 Set browser language to `en-US` — confirm app renders in English on first visit
- [ ] 12.4 Switch language via Settings to `zh-TW` — confirm all UI switches to Traditional Chinese
- [ ] 12.5 Verify currency formatting: `$1,234.50` (en) vs `$1,234.50` (zh-TW)
- [ ] 12.6 Verify date formatting: `January 2025` (en) vs `2025年1月` (zh-TW)
- [ ] 12.7 Verify all 16 category names display correctly in both languages
- [ ] 12.8 Verify all pages render without missing-key indicators
- [ ] 12.9 Verify language preference persists after closing and reopening the app
- [ ] 12.10 Verify privacy page loads correct language version
- [ ] 12.11 Run `scripts/validate-translations.js` — confirm no missing keys

---

## Phase 2: Simplified Chinese + Client-side Re-render (v2)

### 13. Add Simplified Chinese Translations

- [ ] 13.1 Create all `public/locales/zh-CN/*.json` files (~45 files, ~2,000 keys total)
- [ ] 13.2 Update i18next config to include `zh-CN` in supported languages
- [ ] 13.3 Update language selector UI to include Simplified Chinese option
- [ ] 13.4 Verify all pages render correctly in Simplified Chinese

### 14. Client-side Re-render (Optional)

- [ ] 14.1 Replace full page reload with client-side re-render on language switch
- [ ] 14.2 Add `router.reRender()` method that re-executes the current route's render function
- [ ] 14.3 Handle state preservation during re-render (open modals, form data)
- [ ] 14.4 Test re-render works correctly across all pages

### 15. Enhanced Validation

- [ ] 15.1 Expand validation script to catch missing interpolations and plural forms
- [ ] 15.2 Add translation completeness report (percentage of keys translated per language)
- [ ] 15.3 Integrate into CI pipeline for automated checking

### 16. Verification (v2)

- [ ] 16.1 Switch language via Settings to `zh-CN` — confirm all UI switches to Simplified Chinese
- [ ] 16.2 Verify currency formatting: `¥1,234.50` (zh-CN)
- [ ] 16.3 Verify date formatting: `2025年1月` (zh-CN)
- [ ] 16.4 Verify all 16 category names display correctly in Simplified Chinese
- [ ] 16.5 Verify client-side re-render works without page flash
- [ ] 16.6 Run enhanced validation — confirm no missing interpolations or plural forms