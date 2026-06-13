## Context

Categories are currently flat arrays in `categories.js` split by `type` (expense/income). Each category is `{ id, name, icon, color }`. Custom categories are stored in the `settings` IndexedDB store under key `custom_categories`, with the same shape. The addPage renders all categories for the selected type in a 4-column grid — no grouping, no hierarchy. Statistics and budgets aggregate by category `id` directly.

Adding a Group layer introduces a parent entity. Each category (default + custom) references a `groupId`. This cuts across `categories.js`, `categoryManager.js`, `addPage.js`, `statistics.js`, `budgetManager.js`, `recordsList.js`, `dataService.js`, and export/import flows.

## Goals / Non-Goals

**Goals:**
- Introduce a `categoryGroups` IndexedDB object store with full CRUD
- Add `groupId` to both default categories (hardcoded in `categories.js`) and custom categories (stored in settings)
- Render category picker under collapsible group headers in addPage
- Provide group management UI (create, edit, delete, reorder groups)
- Aggregate statistics by group (in addition to by category)
- Support budget targets at group level
- Filter/search records by group
- Migrate all existing data seamlessly (v12→v13)
- Include groups in export/import with ID remapping

**Non-Goals:**
- Nested groups (only two-tier: Group → Category)
- Shared groups across types (expense/income have separate group sets)
- Per-group permissions or visibility rules
- Group-level recurring transactions or amortizations
- Real-time sync of group changes (follows existing sync pattern)

## Decisions

### 1. New IndexedDB object store vs. settings-based storage

**Decision:** New `categoryGroups` object store.

- Matches the established pattern for first-class entities (ledgers, accounts, contacts, debts, amortizations)
- Enables UUID-based deduplication for sync, same as other stores
- Supports direct indexing by `ledgerId` and `type` for efficient queries
- Settings store (`localStorage`-ish key-value) is unsuitable for structured querying

**Alternative considered:** Store groups as a JSON value in the `settings` store under `category_groups`. Rejected because it introduces sync ambiguity (no UUID support), requires full-rewrite on every update, and breaks the pattern used by every other first-class entity.

### 2. `groupId` on category objects vs. separate mapping table

**Decision:** `groupId` as a field on each category object.

- Both default categories (in `categories.js`) and custom categories (in `custom_categories` settings) are plain objects with `id`, `name`, `icon`, `color`
- Adding a `groupId` string field is the minimal change to establish the relationship
- No additional join table or indirection needed
- Clean migration: each category explicitly knows its group

**Alternative considered:** A separate `category_group_membership` store mapping `categoryId → groupId`. Rejected because: (a) custom categories don't have stable integer IDs across devices (only UUID), (b) it adds complexity without benefit since every category belongs to exactly one group, and (c) the current category lookup (`getCategoryById`) would need a second query.

### 3. Group IDs: key field + UUID dual-reference design

**Decision:** Groups have both a `uuid` (for sync) and an optional `key` (stable string identifier for default groups). Categories reference their group via `groupId` — which stores either the group's `key` (for default categories matching default groups) or the group's `uuid` (for custom categories matching custom groups).

- Default categories in `categories.js` have `groupId` set to the group's `key` (e.g., `"dining"`, `"transport"`)
- Custom categories created by the user have `groupId` set to the group's UUID
- The `getAllCategories()` / `getGroupedCategories()` matching logic checks both: `category.groupId === group.key || category.groupId === group.uuid`
- The `key` field is `null` for custom groups; only default groups have a `key`

**Rationale:** This avoids UUID collisions between default and custom groups, keeps default group references human-readable in source code, and maintains UUID-based matching for custom groups during export/import (UUIDs are globally unique so no remapping needed).

### Default group key definitions

The following `key` values are assigned to seeded default groups:

| Type | Key | Name | Categories |
|------|-----|------|-----------|
| expense | `dining` | 餐飲 | food |
| expense | `living` | 生活 | life |
| expense | `transport` | 交通 | traffic |
| expense | `entertainment` | 娛樂 | fun |
| expense | `medical` | 醫療 | medi |
| expense | `education` | 教育 | edu |
| expense | `finance` | 金融 | debt_repayment |
| expense | `other` | 其他 | another |
| income | `salary` | 薪資 | salary |
| income | `extra_income` | 額外收入 | bonus, pocket, parttime |
| income | `investment` | 投資 | invest, interest |
| income | `finance_income` | 金融 | debt_collection |
| income | `other_income` | 其他 | another |

### 4. Migration strategy: v12→v13

**Decision:** Automatic migration in the `upgrade` callback.

1. Create `categoryGroups` object store with indexes: `uuid` (unique), `ledgerId`, `type`
2. Seed default groups for expense (8 groups) and income (5 groups)
3. For each default category in `categories.js`, hardcode the `groupId` matching the new group
4. For custom categories (loaded from `custom_categories` setting), auto-assign to a generic "自訂" group per type (or prompt user on first launch)
5. Existing records are untouched — the `category` field on records doesn't change

**Rollback:** Downgrade not supported. A backup snapshot is taken before migration (same pattern as existing schema upgrades).

### 5. Collapsible group headers in addPage

**Decision:** Each group renders as a section with a toggleable header and its categories as a sub-grid.

- Group header shows group name, icon, color — tappable to collapse/expand
- Categories render in the same 4-column grid layout underneath
- Collapsed state persisted in `localStorage` (per-ledger, per-type)
- "管理" button remains at the bottom of the grid

### 6. Sync integration for categoryGroups

**Decision:** Follow the exact same pattern as other first-class entities (accounts, contacts, debts, amortizations).

- Add `amortizations` to `topoOrder` in `syncService.js` after `recurring_transactions` (before `custom_categories`)
- Add `_applyAdd` / `_applyUpdate` / `_applyDelete` handlers in `syncService.js` for the `categoryGroups` store
- Each CRUD method in `dataService.js` already calls `logChange()` — the sync log entries propagate automatically
- Per-ledger scoping: same `ledgerId` index and filter pattern as other stores

**Alternative considered:** Mapping group sync through settings key-value (like `custom_categories`). Rejected because it would break the established store-level sync pattern and lose UUID-based deduplication.

### 7. getGroupedCategories() API design

**Decision:** Keep `getAllCategories(type)` returning a flat array for backward compatibility, and add `getGroupedCategories(type)` as the new group-aware method.

- `getGroupedCategories(type)` returns `[{ group: {name, icon, color, key, uuid}, categories: [cat1, cat2, ...] }, ...]`
- `getAllCategories(type)` continues to return a flat array (merging all categories across groups)
- Consumers that only populate `<select>` dropdowns (`recurringPage.js`, `amortizationModal.js`, `budgetManager.js`) keep using the flat `getAllCategories()`
- Consumers that render the category grid (`addPage.js`) switch to `getGroupedCategories()`
- `statistics.js` and `recordsList.js` use `getGroupedCategories()` when in group mode

**Rationale:** Avoids breaking 5 flat-array consumers with a single sweeping API change. The flat array is sufficient for dropdowns; only the visual grid needs grouping.

## Risks / Trade-offs

- **[Migration complexity]** Existing custom categories have no `groupId` → Migration must assign them to a fallback group ("自訂"). Users may lose their intended grouping until they re-assign manually. *Mitigation: Show a one-time notice after migration suggesting they review the group assignments.*
- **[Performance]** `getAllCategories()` now joins categories with groups on every call. With <50 categories this is negligible, but the lookup should cache groups in memory (as `categoryManager` already does for custom categories). *Mitigation: Load groups once during `categoryManager.init()`.*
- **[Sync]** Group changes follow the same `sync_log` pattern as other entities. Conflict resolution uses last-writer-wins by timestamp (existing pattern). *No new risk.*
- **[Export compatibility]** Old export files (pre-v13) won't include groups. Importing an old file into v13+ will assign all categories to the fallback "未分類" group. *Mitigation: Documented limitation; users should re-export after upgrading.*
