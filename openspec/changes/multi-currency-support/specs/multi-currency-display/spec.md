## ADDED Requirements

### Requirement: Records list has three display modes
`RecordsListManager` SHALL provide a toggle button in the records list header cycling through three display modes: **Original** (show amount in record's currency), **Converted** (show amount converted to base currency), **Both** (show original + converted). The active mode SHALL be persisted in `localStorage` per ledger under key `recordDisplayMode_{ledgerId}`.

- **Original mode**: each amount SHALL be rendered using `formatCurrency(record.amount, record.currency)`
- **Converted mode**: each amount SHALL be rendered using `formatCurrency(record.amount * (record.exchangeRate ?? 1))`
- **Both mode**: SHALL render as `formatCurrency(amount, currency) (formatCurrency(converted))`

#### Scenario: Toggle display modes
- **GIVEN** a record with amount 1000, currency JPY, rate 0.21, base currency TWD
- **WHEN** display mode is "Original"
- **THEN** the record shows `¥1,000`
- **WHEN** display mode is "Converted"
- **THEN** the record shows `$210`
- **WHEN** display mode is "Both"
- **THEN** the record shows `¥1,000 ($210)`

#### Scenario: Display mode persists
- **WHEN** a user selects "Both" mode, then navigates away and back to the records list
- **THEN** the display mode is still "Both"

### Requirement: Foreign currency records show currency badge
In the records list, records whose `currency` differs from the ledger's `baseCurrency` SHALL display a small currency code badge (e.g., `JPY`, `USD`) next to the amount. This helps users quickly identify which records are in a foreign currency.

#### Scenario: Foreign record has badge
- **GIVEN** a record with `currency: "JPY"` and the ledger's base currency is `"TWD"`
- **WHEN** the record is rendered in the list
- **THEN** a small `JPY` badge appears next to the amount

#### Scenario: Base-currency record has no badge
- **GIVEN** a record with `currency: "TWD"` and the ledger's base currency is also `"TWD"`
- **WHEN** the record is rendered in the list
- **THEN** no currency badge is shown

### Requirement: Debt list shows currency
`debtManager.js` SHALL display debt amounts using `formatCurrency(amount, debt.currency)` or the effective currency resolved from the linked record. The debt summary total SHALL display in the debt's original currency (or base currency if the debt has no explicit currency).

#### Scenario: Debt display with currency
- **GIVEN** a debt with `remainingAmount: 50000` and `currency: "JPY"`
- **WHEN** the debt list renders
- **THEN** the debt amount shows as `¥50,000`

#### Scenario: Debt without currency uses base
- **GIVEN** a debt with `remainingAmount: 1000` and no currency set
- **WHEN** the debt list renders and the ledger's base currency is `"TWD"`
- **THEN** the debt amount shows as `$1,000`

### Requirement: Amortization list shows currency
`amortizationsPage.js` SHALL display amortization amounts (total, down payment, per-period) using `formatCurrency(amount, plan.currency)` or the effective currency. The per-period preview in the installment panel SHALL also use the selected currency.

#### Scenario: Amortization display with currency
- **GIVEN** an amortization plan with `totalAmount: 500000`, `currency: "JPY"`, `amountPerPeriod: 41667`
- **WHEN** the amortization list renders
- **THEN** the total shows as `¥500,000` and per-period shows as `¥41,667`

#### Scenario: Installment panel preview uses selected currency
- **WHEN** a user selects currency `"JPY"` in the add-record page with installment mode enabled
- **THEN** the per-period preview amount is formatted as `¥...`

### Requirement: Account display shows currency (advanced mode)
In advanced account mode, account balances SHALL display with the account's `currency` (or the ledger's `baseCurrency` if the account has no explicit currency). Account selectors SHALL show the currency alongside the account name when the account's currency differs from the ledger's base currency.

#### Scenario: Account with foreign currency
- **GIVEN** an account with `currency: "USD"` and `balance: 500`
- **WHEN** the account is displayed in the account selector
- **THEN** the account name is shown with `(USD)` appended

### Requirement: Plugin API exposes base currency
`PluginManager` SHALL expose a `getBaseCurrency()` method returning the active ledger's `baseCurrency`. A `getSupportedCurrencies()` method SHALL return the full `CURRENCIES` array.

#### Scenario: Plugin gets base currency
- **WHEN** a plugin calls `api.getBaseCurrency()`
- **THEN** the result is the active ledger's `baseCurrency` (e.g., `"TWD"`)

### Requirement: Capability declaration
The system SHALL declare the `multi-currency-display` capability, documenting that original/converted/both display modes, currency badges, and currency-aware debt/amortization/account display are implemented.
