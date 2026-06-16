## Why

All monetary values in this app are stored as bare numbers with no currency denomination. `formatCurrency()` in `utils.js:190` hardcodes TWD and replaces `NT$` with `$`. Records, debts, amortizations, accounts, and budgets all assume a single currency. This breaks down for real-world use cases:

- A "Travel" expense purchased in JPY or USD cannot be recorded in its original currency
- A user who receives income in USD while paying bills in TWD has no way to track both in one ledger
- Statistics aggregate amounts directly with no exchange rate conversion — mixing JPY and TWD amounts produces meaningless totals
- There is no way to answer "how much did I spend in Japan?" without manual mental math

Adding per-record currency with exchange-rate-to-base-currency conversion lets users record transactions in any currency while keeping reports in their home currency.

## What Changes

### Data Model
- **`ledgers` store** — add `baseCurrency` field (ISO 4217, default `"TWD"`)
- **`records` store** — add `currency` (string, ISO 4217) and `exchangeRate` (number, rate to base currency, default 1)
- **`debts` store** — add `currency` and `exchangeRate` (needed because debts track `remainingAmount` and may auto-generate records)
- **`amortizations` store** — add `currency` and `exchangeRate` (needed because amortizations auto-generate periodic records)
- **`accounts` store** — add `currency` (optional, defaults to ledger's baseCurrency; only meaningful in advanced account mode)
- Schema migration (v13→v14): add new fields with defaults for all existing stores

### Record Creation
- Currency picker (dropdown of ~20 common currencies) in the add-record page
- Exchange rate input appears when record currency ≠ base currency
- Exchange rate is stored per-record: `exchangeRate = how many base-currency units per 1 unit of record currency` (e.g., 1 JPY = 0.21 TWD → rate = 0.21)
- Debts and amortizations inherit the currency from the record or user selection
- Optionally: categories can have a `defaultCurrency` hint that pre-fills the picker

### Display
- Records list shows original amount with currency symbol + code: `¥1,000 ($210)`
- Toggle between "show original" / "show converted" / "show both"
- Statistics: all aggregations convert to base currency via `amount * exchangeRate`
- Charts and budget progress bars are always in base currency

### Exchange Rate Strategy (Option A — Manual)
- User enters the exchange rate manually per record
- A "common rates" table in settings can pre-fill rates for frequently used currency pairs
- No live API fetching in this iteration

### Export/Import
- `currency` and `exchangeRate` fields included in export JSON
- On import, new fields pass through directly (no remapping needed for currency codes)
- Historical records missing these fields default to `{ currency: ledger.baseCurrency, exchangeRate: 1 }`

### Budget
- Budget targets always defined in base currency
- Record amounts converted to base currency before comparing against budget

## Capabilities

### New Capabilities
- `multi-currency-core`: Schema v14 migration, per-record currency + exchange rate, currency picker UI, exchange rate input, `formatCurrency(amount, currency)` refactor, base currency in ledger settings
- `multi-currency-statistics`: Exchange-rate-aware aggregation in `getStatistics()`, budget conversion, chart display in base currency
- `multi-currency-display`: Original + converted amount display in records list, debt list, amortization list

### Modified Capabilities
- `formatCurrency()` gains a `currency` parameter for locale-appropriate formatting
- `getStatistics()` multiplies by `exchangeRate` during aggregation
- `addRecord()` / `addDebt()` / `addAmortization()` accept and persist `currency` + `exchangeRate`
- `ledgerManager` handles `baseCurrency` in CRUD

## Impact

- **New files**: *(none — all changes in existing modules)*
- **Modified files (core)**: `dataService.js` (schema v14, CRUD changes, `getStatistics` conversion), `utils.js` (`formatCurrency` refactor, currency symbol map), `addPage.js` (currency picker + exchange rate UI), `recordsList.js` (multi-currency display)
- **Modified files (pages)**: `statistics.js` (verify conversion in dataService), `ledgersPage.js` (base currency selector), `debtManager.js` (currency-aware), `amortizationsPage.js` (currency-aware), `budgetManager.js` (base-currency conversion), `syncService.js` (new fields in sync), `pluginManager.js` (expose baseCurrency)
- **Modified files (settings)**: `main.js` (pass baseCurrency context)
- **Schema version bump**: 13 → 14
