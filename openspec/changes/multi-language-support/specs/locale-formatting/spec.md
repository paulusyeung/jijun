## ADDED Requirements

### Requirement: Dynamic locale in Intl formatters

All `Intl.NumberFormat` and `Intl.DateTimeFormat` calls in `src/js/utils.js` and `src/js/statistics.js` SHALL use the current i18next language instead of the hardcoded `'zh-TW'`. The system SHALL obtain the current language from `i18next.language` and pass it as the locale argument to all `Intl` formatters.

#### Scenario: Currency format matches locale

- **WHEN** language is `'en'` and amount is `1234.5`
- **THEN** the formatted currency SHALL use English formatting conventions (e.g., `$1,234.50`)
- **WHEN** language is `'zh-TW'`
- **THEN** the formatted currency SHALL use Chinese formatting conventions

#### Scenario: Date format matches locale

- **WHEN** the language is `'en'`
- **THEN** dates displayed in charts and records SHALL use English month names (e.g., "January 2025")
- **WHEN** the language is `'zh-CN'`
- **THEN** dates SHALL use Chinese format
