## 1. Data Layer — Schema v14 & Core CRUD Changes

- [ ] 1.1 Bump `dbVersion` from 13 to 14 in `dataService.js`
- [ ] 1.2 Add `currency` and `exchangeRate` fields (optional) to the `records` object store in the upgrade callback
- [ ] 1.3 Add `currency` and `exchangeRate` fields to `debts` store schema
- [ ] 1.4 Add `currency` and `exchangeRate` fields to `amortizations` store schema
- [ ] 1.5 Add `currency` field to `accounts` store schema
- [ ] 1.6 Add `baseCurrency` field to `ledgers` store schema (default `"TWD"`)
- [ ] 1.7 Update `addLedger()` to accept and persist `baseCurrency`
- [ ] 1.8 Update `getLedger()` to return `baseCurrency` (default `"TWD"`)
- [ ] 1.9 Update `updateLedger()` to allow changing `baseCurrency`
- [ ] 1.10 Add `CURRENCIES` constant list in `utils.js` or a new `currencies.js` file with ISO code, symbol, name, decimal digits for ~20 common currencies
- [ ] 1.11 Add helper functions: `getCurrencySymbol(code)`, `getCurrencyName(code)`, `isValidCurrency(code)`, `getDecimalDigits(code)`
- [ ] 1.12 Update export/import (`exportData` / `importData`) to include `currency`, `exchangeRate`, and `baseCurrency` fields; legacy imports default missing fields

## 2. formatCurrency() Refactor

- [ ] 2.1 Refactor `formatCurrency(amount, currency?)` in `utils.js`:
  - If `currency` is provided, use `Intl.NumberFormat` with that ISO code
  - If `currency` is omitted, resolve from active ledger's `baseCurrency`
  - Handle invalid/unknown codes with fallback `${code} ${amount}`
- [ ] 2.2 Update all callers of `formatCurrency()` across the codebase:
  - `recordsList.js`, `statistics.js`, `addPage.js`, `debtManager.js`, `amortizationsPage.js`, `budgetManager.js`, `main.js`, `recurringPage.js`, `pluginManager.js`, etc.
  - Pass the record's `currency` where available; otherwise leave unchanged (falls back to base currency)
- [ ] 2.3 Add `formatOriginalWithBase(amount, currency, exchangeRate, baseCurrency)` helper for "both" display mode

## 3. Add Page — Currency Picker & Exchange Rate Input

- [ ] 3.1 Add currency picker dropdown to the add-record page UI (`addPage.js`)
  - Position: between the category grid and the amount display, or next to the amount
  - Render options as: `TWD ($) — 新台幣`, `JPY (¥) — 日圓`, etc.
  - Default selected: ledger's `baseCurrency`
  - Store selected currency in `currentCurrency` variable
- [ ] 3.2 Add exchange rate input section, **hidden by default** (shown only when `currentCurrency !== baseCurrency`)
  - Label: `1 [currency] = [input] [baseCurrency]`
  - Input type: `number`, step `0.01`, min `0.0001`
  - Default: most recently used rate for this pair (stored in localStorage key `recent_rates`)
- [ ] 3.3 Wire `currentCurrency` and `exchangeRate` into `saveRegularRecord()`:
  ```javascript
  const recordData = {
    ...existingFields,
    currency: currentCurrency,
    exchangeRate: currentCurrency === baseCurrency ? 1 : parseFloat(rateInput.value) || 1,
  };
  ```
- [ ] 3.4 Wire into `saveInstallmentPlan()`:
  - Pass `currency` and `exchangeRate` to `addAmortization()`
  - The `amountPerPeriod` is calculated in the record's currency
  - `exchangeRate` applies when the plan generates records (each generated record uses the plan's rate)
- [ ] 3.5 Update edit mode (`isEditMode`):
  - Pre-select the record's `currency` (or fall back to baseCurrency)
  - Show rate input with the record's `exchangeRate` if currency ≠ baseCurrency
- [ ] 3.6 Update `formatCurrency(currentAmount)` call in the amount display to use `currentCurrency`

## 4. Records List — Multi-Currency Display

- [ ] 4.1 Add display mode toggle button to records list header (Original / Converted / Both)
- [ ] 4.2 Persist mode in localStorage (`recordDisplayMode_{ledgerId}`)
- [ ] 4.3 Update record row rendering:
  - **Original mode**: `formatCurrency(record.amount, record.currency)`
  - **Converted mode**: `formatCurrency(record.amount * (record.exchangeRate ?? 1))` (in base currency)
  - **Both mode**: `formatCurrency(amount, currency)  (formatCurrency(converted))`
- [ ] 4.4 Add currency badge/tag next to amounts that differ from base currency (e.g., `¥1,000` with a small `JPY` badge)
- [ ] 4.5 Update debt and amortization sections in the record list to show currency info

## 5. Statistics — Exchange Rate Conversion

- [ ] 5.1 Update `dataService.getStatistics()`:
  - Fetch current ledger to get `baseCurrency`
  - For each record, compute `baseAmount = record.amount * (record.exchangeRate ?? 1)`
  - Aggregate using `baseAmount` instead of `record.amount`
  - Apply debt settlement logic after currency conversion
  - Include `baseAmount` in the returned record objects
- [ ] 5.2 No changes needed in `statistics.js` for aggregation (it uses the already-aggregated results) — verify with a test
- [ ] 5.3 Update chart tooltips to show base currency symbol

## 6. Debt Manager — Currency Support

- [ ] 6.1 Update `addDebt()` in `dataService.js` to accept and persist `currency` and `exchangeRate`
- [ ] 6.2 Update debt panel in `addPage.js`: when creating a debt from a record, inherit `currency` and `exchangeRate` from the record
- [ ] 6.3 Update debt list display (`debtManager.js`) to use `formatCurrency(amount, currency)`
- [ ] 6.4 Update `settleDebt()` logic:
  - Payment amounts entered in the debt's currency
  - The payment record (if auto-created) inherits the debt's currency and rate
  - `remainingAmount` math operates in the debt's currency (no conversion needed)

## 7. Amortizations — Currency Support

- [ ] 7.1 Update `addAmortization()` in `dataService.js` to accept and persist `currency` and `exchangeRate`
- [ ] 7.2 Update the installment panel in `addPage.js` to inherit currency from the record
- [ ] 7.3 Update `processAmortizations()` in `main.js`:
  - Generated records inherit the plan's `currency` and `exchangeRate`
  - `amountPerPeriod` is in the plan's currency
- [ ] 7.4 Update amortization list display (`amortizationsPage.js`) to use `formatCurrency(amount, currency)`

## 8. Ledgers Page — Base Currency Setting

- [ ] 8.1 Add "Base Currency" field to the create-ledger form (`ledgersPage.js`)
- [ ] 8.2 Add "Base Currency" field to the edit-ledger form
- [ ] 8.3 Show current base currency on the ledger card/tile in the ledger switcher

## 9. Budget Manager — Base Currency Conversion

- [ ] 9.1 Ensure budget targets are always in base currency (no UI change needed — already the case)
- [ ] 9.2 In budget progress calculation, convert each record's amount: `record.amount * (record.exchangeRate ?? 1)`
- [ ] 9.3 Update budget display formatting to use base currency symbol

## 10. Sync Service — New Fields

- [ ] 10.1 Verify `syncService.js` handles `currency` and `exchangeRate` fields automatically through `logChange()` (they're part of the record object, so they should propagate with the existing sync mechanism)
- [ ] 10.2 Add tests to verify: create a record with a non-base currency on device A → sync to device B → verify fields are preserved

## 11. Plugin Manager — Expose Base Currency

- [ ] 11.1 Add `getBaseCurrency()` method to the plugin API in `pluginManager.js` (returns `activeLedger.baseCurrency`)
- [ ] 11.2 Add `getCurrencies()` method returning the full list of supported currencies

## 12. i18n — Currency Translations

- [ ] 12.1 Add currency names to i18n translation files (or use `Intl.DisplayNames` for built-in localization)
- [ ] 12.2 Add labels for new UI elements: currency picker label, exchange rate label, display mode toggle

## 13. Testing

- [ ] 13.1 Unit test: `formatCurrency(amount, currency)` produces correct symbols and formatting
- [ ] 13.2 Unit test: `getStatistics()` converts multi-currency records correctly
- [ ] 13.3 Unit test: debt settlement math with currency fields
- [ ] 13.4 Unit test: amortization record generation inherits currency fields
- [ ] 13.5 Integration test: add record with JPY → verify display in list → verify statistics
- [ ] 13.6 Test: export with multi-currency data → import to fresh DB → verify all fields preserved
