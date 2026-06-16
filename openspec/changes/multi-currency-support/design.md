## Context

The app currently stores all amounts as bare numbers with no currency context. The `formatCurrency()` function in `utils.js:190` is hardcoded to TWD, stripping `NT$` to just `$`. Every store — `records`, `debts`, `amortizations`, `accounts`, `budgets` — assumes a single implicit currency. Statistics in `dataService.getStatistics()` sum amounts directly without any conversion factor.

The existing multi-ledger architecture (schema v8+) provides per-ledger data scoping, but each ledger still assumes all its data is in one currency. This change adds explicit currency tracking per record, with exchange-rate-based conversion to a ledger-level base currency for reporting.

## Goals / Non-Goals

**Goals:**
- Add `baseCurrency` field to the `ledgers` store (default `"TWD"`)
- Add `currency` and `exchangeRate` fields to `records`, `debts`, `amortizations`, and `accounts` stores
- Schema migration v13→v14: create new fields with sensible defaults for all existing data
- Currency picker in the add-record page with common currencies
- Manual exchange rate input when record currency ≠ base currency
- `formatCurrency(amount, currency)` refactored to produce locale-correct output (`$`, `¥`, `€`, `£`, `₩` etc.)
- `getStatistics()` converts all amounts to base currency via `amount * exchangeRate`
- Records list shows original amount + optional converted amount
- Debts and amortizations inherit currency from linked record or user selection
- Budget targets in base currency with conversion applied
- Export/import includes new fields; legacy imports default to base currency

**Non-Goals:**
- Live exchange rate API fetching
- Automatic geo-detection of currency
- Currency conversion for past records (exchange rate is frozen per-record at creation time)
- Per-category default currency (deferred; can be added later as a convenience layer)
- Multi-currency account balance tracking (accounts hold balance in their own currency; no cross-currency balance aggregation)
- Historical exchange rate adjustments

## Decisions

### 1. Per-record exchange rate vs. daily rate table

**Decision:** Exchange rate is **stored per-record** at creation time.

- The rate is frozen when the transaction is created, so historical reports are deterministic
- No need for a separate `exchange_rates` store or time-range lookups
- Simplifies sync: each record carries its own rate
- Simplifies import/export: no separate rate table to remap

**Alternative considered:** A separate `exchange_rates` store with date-indexed rates, looked up at query time. Rejected because: (a) rates change constantly, making historical reports non-deterministic without a snapshot; (b) adds a join on every statistics query; (c) sync complexity increases significantly.

### 2. Exchange rate direction

**Decision:** `exchangeRate` = how many base-currency units per 1 unit of record currency.

- Record amount = 1000, currency = JPY, exchangeRate = 0.21 → base value = 1000 × 0.21 = 210 TWD
- For same-currency records, rate = 1 (amount × 1 = amount)
- Intuitive: "I spent 1000 yen, and each yen is worth 0.21 TWD"

**Rationale:** This is the most natural direction for personal finance. Users think "I spent X in foreign currency, and each unit is worth Y in my home currency."

### 3. Currency picker scope

**Decision:** A fixed dropdown of ~20 commonly used currencies, sorted by frequency of use.

```
TWD (default), JPY, USD, EUR, GBP, KRW, CNY, HKD, SGD, THB, AUD, NZD,
CAD, CHF, SEK, NOK, MYR, IDR, PHP, VND
```

- Full ISO 4217 code + symbol + name displayed: `JPY (¥) — Japanese Yen`
- Free-text input for codes not in the list with ISO validation

### 4. Exchange rate input UX

**Decision:** The exchange rate input appears **conditionally** when record currency ≠ base currency.

- Base currency shown as read-only context: `1 JPY = _____ TWD`
- Default value: the most recently used rate for that currency pair (stored in localStorage)
- Validation: rate must be > 0

### 5. Schema migration v13→v14

**Decision:** Add new fields as optional in the schema, but resolve at read time with a fallback.

```javascript
// In getRecord(), getDebt(), etc.:
const effectiveCurrency = record.currency || ledger.baseCurrency;
const effectiveRate = record.exchangeRate ?? 1;
```

- Existing ledgers get `baseCurrency: "TWD"` via `||` default in `getLedger()`
- Existing records get `currency: undefined, exchangeRate: undefined` → treated as "same as ledger's base currency"
- **No data migration needed** — the fields are optional and resolved at read time
- Still bump schema version to 14 to formally declare the new fields

**Rollback:** Downgrade not needed — removing the new schema fields and read-time fallbacks reverts behavior.

### 6. `formatCurrency()` refactor

**Decision:** Two signatures:

```javascript
formatCurrency(amount)                    // legacy — uses ledger baseCurrency
formatCurrency(amount, currency)          // new — e.g., formatCurrency(1000, 'JPY') → "¥1,000"
```

- Uses `Intl.NumberFormat` with the `currency` ISO code
- Returns proper symbol and digit grouping per locale
- Falls back to `currency + ' ' + number` if the ISO code is invalid

### 7. Statistics conversion

**Decision:** Conversion happens inside `dataService.getStatistics()`.

```javascript
const ledger = await this.getLedger(this.activeLedgerId);
const baseCurrency = ledger.baseCurrency || 'TWD';

records.forEach(record => {
  const rate = record.exchangeRate ?? 1;
  const convertedAmount = record.amount * rate;
  // ... aggregate using convertedAmount
});
```

- Settlement-aware debt adjustment is applied **after** currency conversion
- Result includes both `amount` (original) and `baseAmount` (converted) on each record

### 8. Debt currency handling

**Decision:** Debts store their own `currency` and `exchangeRate`, inherited from the source record.

- Settlement math operates in the debt's currency
- Each payment record locks in its own exchange rate to base currency

### 9. Budget conversion

**Decision:** Budget targets are always set in the ledger's base currency.

- Record amounts converted before budget comparison
- UI note: "所有預算以基準貨幣 (TWD) 計算"

### 10. Display modes

**Decision:** Three display modes, toggleable:

- **Original**: `¥1,000`
- **Converted**: `$210` (default)
- **Both**: `¥1,000 ($210)`

Persisted in localStorage per-ledger.

### 11. Export/Import

**Decision:** New fields pass through directly — no remapping needed for currency codes.

- Export includes `currency` and `exchangeRate` on every record, debt, amortization, account
- Import: records without these fields get defaults via the `?? 1` / `||` fallback

## Risks / Trade-offs

- **[Existing data]** Old records have `exchangeRate: undefined`. The `?? 1` fallback means they behave as before (rate = 1). If a user later changes the ledger's base currency, old records are incorrectly treated as if in the new base currency. *Acceptable for now — we can add a batch migration tool later.*
- **[Exchange rate accuracy]** Manual rates may drift from market rates. *Intentional — frozen rates give deterministic historical reports.*
- **[UX complexity]** Two extra fields on the add-record form. *Mitigation: The currency picker defaults to base currency (most common case), and the rate input is hidden when currency matches base. For most records, the user sees no extra fields.*
- **[Sync]** `exchangeRate` is a simple float — no special sync handling. *No new risk.*
- **[Budget confusion]** Budget progress in base currency may surprise users tracking in a foreign currency. *Mitigation: Budget detail panel shows original amounts breakdown.*
