## Why

Categories are currently flat — all 8 expense categories and 8 income categories sit at the same level. As users add more custom categories, the 4-column grid in the add-record page becomes cluttered and hard to scan. Adding a Group layer (Group → Category) mirrors how users naturally think about their spending (e.g., "餐飲" groups 飲食, 飲料, 早餐) and scales to dozens of custom categories without overwhelming the UI.

## What Changes

### Data Model
- New `categoryGroups` IndexedDB object store (schema v13) — groups are first-class entities with `id`, `uuid`, `ledgerId`, `type` (expense/income), `name`, `icon`, `color`, `order`, `isSystem`, `key` (stable string identifier for default groups), `createdAt`
- Each category object (default + custom) gains a `groupId` field referencing its parent group
- Schema migration (v12→v13): creates the store, seeds default groups, auto-assigns existing categories to matching groups

### Default Groups
| Type | Groups | Assigned categories |
|------|--------|-------------------|
| Expense | 餐飲, 生活, 交通, 娛樂, 醫療, 教育, 金融, 其他 | All 8 existing expense categories respectively |
| Income | 薪資, 額外收入, 投資, 金融, 其他 | All 8 existing income categories respectively |

### UI
- **Category picker** (addPage): categories rendered under collapsible group headers
- **Group management**: new modal/section for CRUD on groups (name, icon, color) — accessibly from category management screen
- **Category creation/editing**: new `groupId` dropdown when adding a custom category
- **Statistics**: aggregation and pie/bar charts can be grouped by group, with drill-down into categories
- **Budget**: budget targets configurable at the group level (sum of category budgets)
- **Records list**: filter/search by group name

### Export/Import
- Group definitions included in export JSON
- Auto-ID remapping on import (same pattern as ledgers)

No breaking changes — existing records keep their `category` field; the `groupId` is purely organizational metadata.

## Capabilities

### New Capabilities
- `category-groups-core`: Data model (`categoryGroups` IndexedDB store), CRUD operations, schema migration (v12→v13), group management UI (create/edit/delete/reorder groups with icon & color), and category picker UI in addPage rendering collapsible group headers
- `category-groups-integration`: Statistics aggregation by group, budget targets at group level, records filter/search by group, and export/import of group definitions with ID remapping

### Modified Capabilities
*(none)*

## Impact

- **New files**: *(none — all changes are in existing modules)*
- **Modified files (core)**: `dataService.js` (new store + CRUD, schema upgrade), `categories.js` (add `groupId` to default categories), `categoryManager.js` (group CRUD, `getAllCategories` groups-aware, group management UI), `addPage.js` (grouped category picker), `syncService.js` (sync support for `categoryGroups` store), `pluginManager.js` (expose groups to plugin API), `amortizationModal.js` (group-aware category select), `quickSelectManager.js` (group-aware category rendering)
- **Modified files (pages)**: `statistics.js` (group-level aggregation), `budgetManager.js` (group budget), `recordsList.js` (group filter), `main.js` (init groups), `recurringPage.js` (group-aware category select)
- **Modified files (tests)**: `tests/unit/categories.test.js`, `tests/unit/budgetManager.test.js`, `tests/unit/pluginManager.test.js`
- **Schema version bump**: 12 → 13
