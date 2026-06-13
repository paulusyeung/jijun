## ADDED Requirements

### Requirement: i18next initialization

The system SHALL initialize i18next on application startup with the following configuration:
- Fallback language: `'en'`
- Language detection: `localStorage` → `navigator.language` → fallback `'en'`
- Translation resources loaded from `/locales/{{lng}}/{{ns}}.json`
- Supported languages (v1): `'en'`, `'zh-TW'`
- Supported languages (v2): `'en'`, `'zh-CN'`, `'zh-TW'`
- Debug mode: disabled in production

#### Scenario: Language detection order

- **WHEN** a user visits the app for the first time with browser language set to `'en-US'`
- **THEN** the system SHALL detect `'en'` as the closest supported language
- **WHEN** the same user selects Traditional Chinese in the settings
- **THEN** the system SHALL persist `'zh-TW'` to localStorage
- **WHEN** the user visits again after closing the browser
- **THEN** the system SHALL load `'zh-TW'` from localStorage preference

### Requirement: t() function exported

The system SHALL export a `t()` function from `src/js/i18n.js` that delegates to `i18next.t()`. It SHALL support the `namespace:key` syntax and interpolation with `{{variable}}` syntax.

#### Scenario: Basic translation lookup

- **WHEN** `t('common.save')` is called and `common.json` contains `{ "save": "儲存" }`
- **THEN** the result SHALL be `"儲存"`
- **WHEN** `t('common.save')` is called but the current language is English
- **THEN** the result SHALL be the English translation `"Save"`

#### Scenario: Interpolation

- **WHEN** `t('ledger.confirmDelete', { name: '旅行' })` is called
- **THEN** the result SHALL contain the interpolated name value

### Requirement: languageChanged event (v1 - Full Page Reload)

When the user changes the language, the system SHALL:
- Update `document.documentElement.lang` attribute
- Persist the new language to `localStorage`
- Trigger a full page reload (`location.reload()`)

#### Scenario: Language switch triggers reload (v1)

- **WHEN** a user selects a new language in Settings
- **THEN** `document.documentElement.lang` SHALL be updated
- **THEN** the new language SHALL be persisted to localStorage
- **THEN** the page SHALL reload to apply the new language

### Requirement: languageChanged event (v2 - Client-side Re-render)

When the user changes the language, the system SHALL:
- Update `document.documentElement.lang` attribute
- Dispatch a custom event `'languageChanged'` on `document.documentElement`
- Re-render the current page via the router without full reload

#### Scenario: Language switch triggers re-render (v2)

- **WHEN** a user selects a new language in Settings
- **THEN** `document.documentElement.lang` SHALL be updated
- **THEN** the current page SHALL re-render with translated strings
- **THEN** no full page reload SHALL occur

### Requirement: Build-time translation validation

The system SHALL include a Node.js script (`scripts/validate-translations.js`) that:
- Greps all `t('namespace:key')` calls in source files
- Cross-references against keys in `public/locales/en/*.json` and `public/locales/zh-TW/*.json`
- Fails if any key is missing from the translation files

#### Scenario: Validation catches missing keys

- **WHEN** a developer adds a new `t('home.newFeature')` call but forgets to add it to the JSON files
- **THEN** running `scripts/validate-translations.js` SHALL fail with an error message
- **AND** the error message SHALL indicate which key is missing and in which namespace