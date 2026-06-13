## ADDED Requirements

### Requirement: Language selector in Settings page

The Settings page SHALL contain a language selector UI (dropdown or button group) that displays the three supported languages with native names:
- English
- 繁體中文
- 简体中文

The selector SHALL be placed in the "應用程式" (Application) section of the Settings page.

#### Scenario: Language selection persists

- **WHEN** a user selects `English` from the language selector
- **THEN** the system SHALL save the preference to localStorage
- **THEN** the current page SHALL re-render in English
- **WHEN** the user closes and reopens the app
- **THEN** the selected language SHALL persist

### Requirement: Language change triggers page re-render

When the user selects a new language, the system SHALL call `i18next.changeLanguage()`, update `document.documentElement.lang`, dispatch a `languageChanged` event, and invoke `router.reRender()` to re-render the current page with translated content.

#### Scenario: All pages update on language switch

- **WHEN** a user is on the Home page and switches from `'zh-TW'` to `'en'`
- **THEN** the Home page SHALL re-render in English without a full browser reload
- **WHEN** a user is on Settings and switches language
- **THEN** the Settings page SHALL re-render in the new language
