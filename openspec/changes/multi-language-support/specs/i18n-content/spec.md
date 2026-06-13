## ADDED Requirements

### Requirement: Translation JSON structure

Translation files SHALL be placed at `public/locales/{lang}/{namespace}.json`. Each namespace SHALL contain a flat or nested JSON object of key-value pairs where values are translated strings.

#### Scenario: Namespace file loading (v1)

- **WHEN** the app initializes with language `'zh-TW'`
- **THEN** the system SHALL load `/locales/zh-TW/common.json`, `/locales/zh-TW/home.json`, etc.
- **AND** only English and Traditional Chinese files SHALL exist in v1

#### Scenario: Namespace file loading (v2)

- **WHEN** the app initializes with language `'zh-CN'`
- **THEN** the system SHALL load `/locales/zh-CN/common.json`, `/locales/zh-CN/home.json`, etc.
- **AND** all three languages (en, zh-TW, zh-CN) SHALL be available

### Requirement: Complete namespace coverage

The following namespaces SHALL exist for each supported language:
- `common`: Navigation labels, button text, toast messages, modal buttons, shared UI strings
- `home`: Home page widget labels, budget labels, recent records
- `add`: Add/edit record form, debt panel, installment panel
- `settings`: Settings page sections, toggle labels, data management, about section
- `records`: Records list (week/month/year tabs), filter labels
- `stats`: Statistics page header
- `ledger`: Ledger management page, create/edit/delete/share modals
- `accounts`: Account management page
- `debts`: Debt management, contact management
- `recurring`: Recurring transactions page
- `amortizations`: Amortizations page
- `plugins`: Plugin store, installed plugins
- `sync`: Sync settings page
- `categories`: All 16 default category display names (expense + income)
- `errors`: Error messages, validation messages

#### Scenario: No missing keys in default language (v1)

- **WHEN** any page renders with language `'zh-TW'`
- **THEN** all `t()` calls SHALL resolve to a Chinese string (zh-TW is the source language)
- **WHEN** English is selected
- **THEN** any missing key SHALL fall back to the `en` translation
- **WHEN** a key is missing in both `en` and the current locale
- **THEN** the system SHALL display the key name as a visible indicator

#### Scenario: No missing keys in default language (v2)

- **WHEN** any page renders with language `'zh-CN'`
- **THEN** all `t()` calls SHALL resolve to a Simplified Chinese string
- **WHEN** a key is missing in `zh-CN` but exists in `en`
- **THEN** the system SHALL fall back to the English translation
- **WHEN** a key is missing in all locales
- **THEN** the system SHALL display the key name as a visible indicator

### Requirement: Build-time validation integration

The build process SHALL run the translation validation script before completing.

#### Scenario: Build fails with missing translations

- **WHEN** a developer runs `npm run build`
- **AND** there are missing translation keys detected by `scripts/validate-translations.js`
- **THEN** the build SHALL fail with a clear error message
- **AND** the error message SHALL list all missing keys and their namespaces

#### Scenario: Build succeeds with complete translations

- **WHEN** a developer runs `npm run build`
- **AND** all translation keys are present in both `en` and `zh-TW` files
- **THEN** the build SHALL succeed
- **AND** the locales directory SHALL be copied to `dist/locales/` without modification