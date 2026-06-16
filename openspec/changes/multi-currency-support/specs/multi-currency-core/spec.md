## ADDED Requirements

### Requirement: Ledger has a base currency
Every ledger SHALL have a `baseCurrency` field (ISO 4217 code, default `"TWD"`). The `addLedger()` method SHALL accept an optional `baseCurrency` parameter. The `getLedger()` method SHALL return `baseCurrency` (defaulting to `"TWD"` if missing). The `updateLedger()` method SHALL allow changing `baseCurrency`. The create-ledger and edit-ledger forms SHALL include a base currency selector populated from the supported currencies list.

#### Scenario: New ledger uses default base currency
- **WHEN** a user creates a new ledger without specifying `baseCurrency`
- **THEN** the ledger's `baseCurrency` is `"TWD"`

#### Scenario: Create ledger with custom base currency
- **WHEN** a user creates a new ledger and selects `"JPY"` as the base currency
- **THEN** the ledger's `baseCurrency` is `"JPY"`

#### Scenario: Change ledger base currency
- **WHEN** a user edits a ledger and changes its `baseCurrency` from `"TWD"` to `"USD"`
- **THEN** `getLedger()` returns `baseCurrency: "USD"` for that ledger

### Requirement: Record stores currency and exchange rate
Each `records` object store entry SHALL have optional `currency` (ISO 4217 string) and `exchangeRate` (positive number) fields. When a record is read, the effective currency SHALL be resolved as `record.currency || ledger.baseCurrency`. The effective exchange rate SHALL be `record.exchangeRate ?? 1`.

#### Scenario: Record with foreign currency
- **WHEN** a record is created with `currency: "JPY"` and `exchangeRate: 0.21`
- **THEN** the record is stored with these values; the effective base-currency amount is `amount * 0.21`

#### Scenario: Record without currency uses ledger default
- **WHEN** a record is created without specifying `currency` or `exchangeRate`
- **THEN** the stored `currency` is `undefined`; at read time `currency` resolves to the ledger's `baseCurrency` and `exchangeRate` resolves to `1`

### Requirement: Currency picker in add-record page
The add-record page SHALL display a currency selector dropdown positioned between the category grid and the amount display. It SHALL list all supported currencies showing ISO code, symbol, and localized name (e.g., `JPY (¥) — 日圓`). The default selection SHALL be the active ledger's `baseCurrency`. The selector SHALL also support free-text input for currency codes not in the predefined list, with ISO 4217 validation (3 uppercase letters).

#### Scenario: Currency picker defaults to base currency
- **WHEN** the add-record page loads
- **THEN** the currency selector defaults to the active ledger's `baseCurrency`

#### Scenario: User selects a different currency
- **WHEN** a user taps the currency selector and picks `"JPY"`
- **THEN** the selector displays `JPY (¥) — 日圓`; an exchange rate input field appears below

### Requirement: Exchange rate input appears conditionally
An exchange rate input SHALL appear in the add-record page only when the selected currency differs from the ledger's `baseCurrency`. The input SHALL display a read-only label: `1 [selected currency] = _____ [baseCurrency]`. The input type SHALL be `number` with `step="0.01"` and `min="0.0001"`. A default value SHALL be pre-filled from the most recently used rate for that currency pair (stored in `localStorage` key `recentRates` as a JSON map).

#### Scenario: Same-currency record hides rate input
- **WHEN** the selected currency equals the ledger's `baseCurrency`
- **THEN** the exchange rate input is hidden

#### Scenario: Different-currency record shows rate input
- **WHEN** a user selects `"JPY"` and the ledger's base currency is `"TWD"`
- **THEN** the rate input appears with label `1 JPY = _____ TWD`

#### Scenario: Recent rate is pre-filled
- **WHEN** a user previously entered rate `0.21` for JPY→TWD, then starts a new record with JPY selected
- **THEN** the exchange rate input is pre-filled with `0.21`

### Requirement: Schema v13→v14 migration
The `DataService.init()` upgrade callback SHALL bump `dbVersion` from 13 to 14. The new fields (`currency`, `exchangeRate`, `baseCurrency`) SHALL be added as optional — no existing data transformation is required. Existing records, debts, amortizations, and accounts SHALL continue to work with the `||` / `??` fallback logic.

#### Scenario: Upgrade from v13 to v14
- **WHEN** IndexedDB schema upgrades from version 13 to 14
- **THEN** the `records`, `debts`, `amortizations`, and `accounts` stores are updated in schema only; existing records retain their current fields; all read operations fall back to `ledger.baseCurrency` and `exchangeRate ?? 1`

### Requirement: `formatCurrency()` accepts optional currency parameter
`formatCurrency(amount, currency?)` in `utils.js` SHALL:
- If `currency` is provided and valid, use `Intl.NumberFormat` with that ISO code and return the formatted string with the correct locale symbol (e.g., `¥1,000`, `$100`, `€50`, `£75`)
- If `currency` is omitted, resolve from `activeLedger.baseCurrency`
- If the currency code is unknown or invalid, fall back to `"${currency} ${formattedNumber}"`

#### Scenario: Format with currency parameter
- **WHEN** `formatCurrency(1000, 'JPY')` is called
- **THEN** the result is `"¥1,000"`
- **WHEN** `formatCurrency(100, 'USD')` is called
- **THEN** the result is `"$100.00"`

#### Scenario: Format without currency parameter
- **WHEN** `formatCurrency(1000)` is called and the active ledger's `baseCurrency` is `"TWD"`
- **THEN** the result is `"$1,000"` (existing behavior preserved)

### Requirement: Supported currencies list
A `CURRENCIES` constant array SHALL be defined with the following entries, each containing ISO code (`code`), symbol (`symbol`), localized name key (`nameKey`), and decimal digits (`digits`):
```
TWD ($, 0), JPY (¥, 0), USD ($, 2), EUR (€, 2), GBP (£, 2),
KRW (₩, 0), CNY (¥, 2), HKD ($, 2), SGD ($, 2), THB (฿, 2),
AUD ($, 2), NZD ($, 2), CAD ($, 2), CHF (CHF, 2), SEK (kr, 2),
NOK (kr, 2), MYR (RM, 2), IDR (Rp, 0), PHP (₱, 2), VND (₫, 0)
```
Helper functions SHALL be provided: `getCurrencySymbol(code)`, `getCurrencyName(code)`, `isValidCurrency(code)`, `getDecimalDigits(code)`.

#### Scenario: Lookup currency properties
- **WHEN** `getCurrencySymbol('JPY')` is called
- **THEN** the result is `"¥"`
- **WHEN** `isValidCurrency('XYZ')` is called
- **THEN** the result is `false`

### Requirement: Record saves currency and exchange rate
The `saveRegularRecord()` function in `addPage.js` SHALL include `currency` and `exchangeRate` in the record data passed to `dataService.addRecord()`. When `currency === baseCurrency`, `exchangeRate` SHALL be stored as `1`. The `saveInstallmentPlan()` function SHALL similarly pass `currency` and `exchangeRate` to `addAmortization()`.

#### Scenario: Save record with foreign currency
- **WHEN** a user enters amount 1000, selects currency JPY, enters rate 0.21, and saves
- **THEN** `dataService.addRecord()` is called with `{ amount: 1000, currency: 'JPY', exchangeRate: 0.21, ... }`

#### Scenario: Save record with base currency
- **WHEN** a user enters amount 500 and the selected currency is the ledger's base currency (TWD)
- **THEN** `dataService.addRecord()` is called with `{ amount: 500, currency: 'TWD', exchangeRate: 1, ... }`

### Requirement: Edit mode restores currency and rate
When editing an existing record (`isEditMode`), the currency selector SHALL pre-select the record's stored `currency` (or fall back to `baseCurrency`). If the record's `currency` differs from `baseCurrency`, the exchange rate input SHALL be visible and pre-filled with the stored `exchangeRate`.

#### Scenario: Edit foreign-currency record
- **WHEN** a user edits a record with `currency: "JPY"` and `exchangeRate: 0.21`
- **THEN** the currency selector shows `"JPY"`; the rate input shows `0.21` and is visible

### Requirement: Export/Import includes currency fields
`exportData()` SHALL include `currency` and `exchangeRate` on each record, debt, amortization, and account, plus `baseCurrency` on each ledger. `importData()` SHALL accept imports without these fields (legacy) — missing values are handled by the `||` / `??` read-time fallbacks.

#### Scenario: Export includes currency fields
- **WHEN** a user exports data
- **THEN** each record in the export JSON has `currency` and `exchangeRate` fields; each ledger has `baseCurrency`

#### Scenario: Import legacy data
- **WHEN** a user imports an export file without `currency` or `exchangeRate` fields
- **THEN** records without these fields are stored as-is; read-time fallbacks resolve them to the ledger's `baseCurrency` and rate `1`

### Requirement: Supported capabilities listing
The system SHALL declare the `multi-currency-core` capability in its capability registry (if applicable), documenting that schema v14, per-record currency + exchange rate, currency picker UI, exchange rate input, `formatCurrency()` refactor, and base currency in ledger settings are implemented.
