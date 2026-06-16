## 1. Data Layer — Schema v14 & Core CRUD Changes

- [x] 1.1 Bump `dbVersion` from 13 to 14 in `dataService.js`
- [x] 1.2 Add `currency` and `exchangeRate` fields (optional) to the `records` object store in the upgrade callback
- [x] 1.3 Add `currency` and `exchangeRate` fields to `debts` store schema
- [x] 1.4 Add `currency` and `exchangeRate` fields to `amortizations` store schema
- [x] 1.5 Add `currency` field to `accounts` store schema
- [x] 1.6 Add `baseCurrency` field to `ledgers` store schema (default `"TWD"`)
- [x] 1.7 Update `addLedger()` to accept and persist `baseCurrency`
- [x] 1.8 Update `getLedger()` to return `baseCurrency` (default `"TWD"`)
- [x] 1.9 Update `updateLedger()` to allow changing `baseCurrency` (already handled by spread in `updateLedger`)
- [x] 1.10 Add `CURRENCIES` constant list in `utils.js` with ISO code, symbol, name key, decimal digits for ~20 common currencies
- [x] 1.11 Add helper functions: `getCurrencySymbol(code)`, `getCurrencyName(code)`, `isValidCurrency(code)`, `getDecimalDigits(code)`
- [x] 1.12 Update export/import (`exportData` / `importData`) to include `currency`, `exchangeRate`, and `baseCurrency` fields; legacy imports default missing fields (export already passes through all fields; import spreads data as-is; read-time fallback handles legacy data)

## 2. formatCurrency() Refactor

- [x] 2.1 Refactor `formatCurrency(amount, currency?)` in `utils.js`:
  - If `currency` is provided, use `Intl.NumberFormat` with that ISO code
  - If `currency` is omitted, resolve from active ledger's `baseCurrency` (via window.app.dataService)
  - Handle invalid/unknown codes with fallback `${code} ${amount}`
- [ ] 2.2 Update all callers of `formatCurrency()` across the codebase:
  - `recordsList.js`, `statistics.js`, `addPage.js`, `debtManager.js`, `amortizationsPage.js`, `budgetManager.js`, `main.js`, `recurringPage.js`, `pluginManager.js`, etc.
  - Pass the record's `currency` where available; otherwise leave unchanged (falls back to base currency)
- [x] 2.3 Add `formatOriginalWithBase(amount, currency, exchangeRate, baseCurrency)` helper for "both" display mode

## 3. Add Page — Currency Picker & Exchange Rate Input

- [x] 3.1 Add currency picker dropdown to the add-record page UI (`addPage.js`)
  - Position: above the debt panel, below the header
  - Render options as: `TWD ($)`, `JPY (¥)`, etc.
  - Default selected: ledger's `baseCurrency`
  - Store selected currency in `currentCurrency` variable
- [x] 3.2 Add exchange rate input section, **hidden by default** (shown only when `currentCurrency !== baseCurrency`)
  - Label: `1 [currency] = [input] [baseCurrency]`
  - Input type: `number`, step `0.01`, min `0.0001`
  - Default: most recently used rate for this pair (stored in localStorage key `recentRates`)
- [x] 3.3 Wire `currentCurrency` and `exchangeRate` into `saveRegularRecord()`
- [x] 3.4 Wire into `saveInstallmentPlan()` with currency and exchangeRate
- [x] 3.5 Update edit mode to restore currency and rate
- [x] 3.6 Update `formatCurrency(currentAmount)` call to use `currentCurrency`

## 4. Records List — Multi-Currency Display

- [x] 4.1 Add display mode toggle button to records list header (Original / Converted / Both)
- [x] 4.2 Persist mode in localStorage (`recordDisplayMode_{ledgerId}`)
- [x] 4.3 Update record row rendering to use `_formatRecordAmount()` which handles all modes
- [x] 4.4 Add currency badge/tag next to amounts that differ from base currency
- [ ] 4.5 Update debt and amortization sections in the record list to show currency info

## 5. Statistics — Exchange Rate Conversion

- [x] 5.1 Update `dataService.getStatistics()`:
  - Fetch current ledger to get `baseCurrency`
  - For each record, compute `baseAmount = record.amount * (record.exchangeRate ?? 1)`
  - Aggregate using `baseAmount` instead of `record.amount`
  - Apply debt settlement logic after currency conversion
  - Include `baseAmount` in the returned record objects
- [ ] 5.2 No changes needed in `statistics.js` for aggregation (it uses the already-aggregated results) — verify with a test
- [ ] 5.3 Update chart tooltips to show base currency symbol

## 6. Debt Manager — Currency Support

- [x] 6.1 Update `addDebt()` in `dataService.js` to accept and persist `currency` and `exchangeRate`
- [x] 6.2 Update debt panel in `addPage.js`: when creating a debt from a record, inherit `currency` and `exchangeRate` from the record
- [x] 6.3 Update debt list display (`debtManager.js`) to use `formatCurrency(amount, currency)`
- [x] 6.4 Update `settleDebt()` logic: payment records inherit debt's currency and rate; remainingAmount math operates in debt's currency

## 7. Amortizations — Currency Support

- [x] 7.1 Update `addAmortization()` in `dataService.js` to accept and persist `currency` and `exchangeRate` (spread via `...data`)
- [x] 7.2 Update the installment panel in `addPage.js` to inherit currency from the record
- [ ] 7.3 Update `processAmortizations()` in `main.js` — generated records inherit the plan's `currency` and `exchangeRate`
- [x] 7.4 Update amortization list display (`amortizationsPage.js`) to use `formatCurrency(amount, currency)`

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
