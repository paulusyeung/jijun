## Why

The application is exclusively hardcoded in Traditional Chinese (~2,000 translatable strings across 35+ files), locking out English-speaking and Simplified Chinese users. Adding i18n support opens the app to a global audience, makes the PWA accessible to non-Chinese speakers, and establishes a sustainable translation architecture for future locales.

## What Changes

### Phase 1 (v1): English + Traditional Chinese
- Add `i18next` + `i18next-browser-languagedetector` as dependencies
- Create `src/js/i18n.js` — initialization module with `t()` translation function and language change handling
- Extract all ~2,000 hardcoded Chinese UI strings into translation JSON files under `public/locales/`
  - English (`en/`) as the base/fallback language
  - Traditional Chinese (`zh-TW/` — existing text, becomes canonical translation)
- Replace every hardcoded Chinese string in template literals with `t('namespace.key')` calls across all page components, utility modules, and `index.html`
- Refactor category names in `categories.js` to use translatable keys instead of hardcoded Chinese names
- Replace hardcoded `'zh-TW'` locale in `Intl.NumberFormat` and `Intl.DateTimeFormat` with dynamic locale from i18next
- Add language switcher `<select>` in the Settings page
- Wire `languageChanged` event to **full page reload** (simpler, safer for v1)
- Create build-time validation script to verify translation key completeness
- Special-case handling for the changelog and privacy policy page (large prose blocks)

### Phase 2 (v2): Simplified Chinese + Client-side Re-render
- Add Simplified Chinese (`zh-CN/`) translations after v1 is stable
- Replace full page reload with client-side re-render for smoother UX
- Expand validation script to catch missing interpolations and plural forms

No breaking changes — existing data and functionality remain identical.

## Capabilities

### New Capabilities
- `i18n-engine`: i18next initialization, language detection (browser preference → localStorage → English fallback), `t()` function export, and `languageChanged` event system
- `i18n-content`: Translation JSON resource files for **Phase 1: two languages** (`en`, `zh-TW`), organized by namespace (common, home, settings, add, records, stats, ledger, accounts, debts, recurring, amortizations, plugins, sync, categories, errors). **Phase 2: adds `zh-CN`**.
- `ui-localization`: Refactoring all page components and utility modules to replace hardcoded Chinese strings with `t()` calls; category name internationalization
- `language-switcher`: UI component in the Settings page allowing users to select between English and Traditional Chinese (v1); Simplified Chinese added in v2. Language change triggers **full page reload** (v1).
- `locale-formatting`: Dynamic `Intl` formatters that use the i18next current language instead of the hardcoded `'zh-TW'`
- `translation-validation`: Build-time script to verify all `t()` keys exist in translation JSON files, preventing missing translations in production

### Modified Capabilities
*(none)*

## Impact

- **New files**: `src/js/i18n.js`, `scripts/validate-translations.js`, `public/locales/en/*.json` (12-15 files), `public/locales/zh-TW/*.json` (12-15 files). **Phase 2 adds** `public/locales/zh-CN/*.json`.
- **Modified files (page templates — 18 files)**: `settingsPage.js`, `homePage.js`, `addPage.js`, `recordsPage.js`, `statsPage.js`, `ledgersPage.js`, `accountsPage.js`, `debtsPage.js`, `contactsPage.js`, `recurringPage.js`, `amortizationsPage.js`, `pluginsPage.js`, `storePage.js`, `themesPage.js`, `themeStorePage.js`, `syncSettingsPage.js`, `privacyPage.js`, `licensePage.js`
- **Modified files (core modules — 12 files)**: `utils.js`, `categories.js`, `categoryManager.js`, `debtManager.js`, `budgetManager.js`, `recordsList.js`, `statistics.js`, `changelog.js`, `rewardService.js`, `pluginManager.js`, `syncService.js`, `router.js`, `main.js`, `notificationService.js`
- **Modified files (infrastructure — 4 files)**: `package.json`, `vite.config.js`, `index.html`, `scripts/validate-translations.js`
- **New dependencies**: `i18next`, `i18next-browser-languagedetector`

