## ADDED Requirements

### Requirement: Statistics convert amounts to base currency
`DataService.getStatistics()` SHALL convert each record's amount to the ledger's base currency before aggregation. For each record, the base value SHALL be computed as `record.amount * (record.exchangeRate ?? 1)`. The effective currency SHALL be `record.currency || ledger.baseCurrency`. Settlement-aware debt adjustment logic SHALL be applied **after** currency conversion.

The result object SHALL include:
- `totalIncome` — sum of converted income amounts (after debt adjustment)
- `totalExpense` — sum of converted expense amounts (after debt adjustment)
- `incomeByCategory` / `expenseByCategory` — maps of category → converted total
- `dailyTotals` — map of date → `{ income, expense }` in base currency
- `records` — array of records with both `amount` (original) and `baseAmount` (converted)

#### Scenario: Multi-currency statistics aggregation
- **GIVEN** three records: (1) expense $100 TWD, (2) expense ¥1000 JPY at rate 0.21, (3) expense €50 EUR at rate 34
- **WHEN** `getStatistics()` is called with the ledger's base currency set to `"TWD"`
- **THEN** `totalExpense` = 100 + (1000 × 0.21) + (50 × 34) = 100 + 210 + 1700 = $2,010

#### Scenario: Same-currency statistics unchanged
- **GIVEN** all records have currency matching the ledger's base currency (or no currency set)
- **WHEN** `getStatistics()` is called
- **THEN** the returned totals are identical to pre-multi-currency behavior (exchangeRate defaults to 1)

#### Scenario: Debt settlement applied after currency conversion
- **GIVEN** a receivable debt of 500 JPY at rate 0.21, and a partial payment record of 300 JPY at rate 0.22
- **WHEN** `getStatistics()` processes the payment record
- **THEN** debt settlement logic computes effective amount using `300 × 0.22 = 66 TWD` as the converted payment value

#### Scenario: Record carries baseAmount
- **WHEN** `getStatistics()` returns the `records` array
- **THEN** each record object includes a `baseAmount` field with the converted value

### Requirement: Charts display in base currency
Chart tooltips, axis labels, and legends in `statistics.js` SHALL use the ledger's `baseCurrency` for all monetary values. The donut chart SHALL show aggregated values in base currency when hovering over slices. The trend line chart SHALL show base currency on the Y-axis.

#### Scenario: Chart tooltips show base currency
- **WHEN** a user hovers over a donut chart slice
- **THEN** the tooltip displays the aggregated amount in the ledger's base currency (e.g., `$2,010`)

### Requirement: Budget progress converts record amounts
`BudgetManager` SHALL convert each record's amount to the ledger's `baseCurrency` before comparing against budget targets. Budget targets SHALL be defined and displayed exclusively in the ledger's `baseCurrency`.

#### Scenario: Budget calculation with mixed currencies
- **GIVEN** a monthly budget of $30,000 TWD for "Travel", a travel record of ¥50,000 JPY at rate 0.21
- **WHEN** budget progress is calculated
- **THEN** the used amount is `50,000 × 0.21 = $10,500 TWD`; progress = 35%

#### Scenario: Budget UI shows base currency
- **WHEN** a user views the budget management page
- **THEN** all budget targets and progress amounts display with the base currency symbol; a note reads "所有預算以基準貨幣 (TWD) 計算"

### Requirement: Top expenses list shows converted amounts
The top expenses list in the statistics page SHALL sort and display records by their `baseAmount` (converted to base currency). The display SHALL also show the original amount with currency for context.

#### Scenario: Top expenses sorted by base value
- **WHEN** a user views the top expenses list containing mixed-currency records
- **THEN** records are sorted by `baseAmount` descending; each row shows both the original amount (`¥1,000`) and the converted amount (`$210`)

### Requirement: Capability declaration
The system SHALL declare the `multi-currency-statistics` capability, documenting that exchange-rate-aware aggregation, budget conversion, and base-currency chart display are implemented.
