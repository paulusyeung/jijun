## ADDED Requirements

### Requirement: All page templates use t() for UI strings

Every user-facing string in page component files SHALL use the `t()` function instead of hardcoded Chinese text. This applies to template literal strings, button labels, modal text, toast messages, confirm dialogs, and error messages.

#### Scenario: No hardcoded Chinese in templates

- **WHEN** a page renders with language `'en'`
- **THEN** all UI text SHALL appear in English
- **WHEN** the user switches to `'zh-CN'`
- **THEN** all UI text SHALL appear in Simplified Chinese

### Requirement: Category names are translatable

The `categories.js` module SHALL add a `nameKey` property to each category definition. A `getCategoryName(cat)` helper SHALL resolve the display name via `t(cat.nameKey)`. All category rendering code throughout the app SHALL use this helper.

#### Scenario: Category name in selected language

- **WHEN** the language is `'en'`
- **THEN** `getCategoryName({ nameKey: 'categories.expense.food' })` SHALL return `"Food & Dining"`
- **WHEN** the language is `'zh-CN'`
- **THEN** the same call SHALL return `"饮食"`

### Requirement: index.html strings are localized

The static HTML template in `index.html` SHALL use `data-i18n` attributes or inline `t()` calls for all user-facing text, including nav labels, sidebar text, footer text, and version info.

#### Scenario: Nav labels switch language

- **WHEN** the language is `'en'`
- **THEN** the bottom nav bar SHALL display "Home", "Records", "Add", "Stats", "Settings"
- **WHEN** the language is `'zh-TW'`
- **THEN** the bottom nav bar SHALL display "首頁", "明細", "新增紀錄", "統計", "設定"
