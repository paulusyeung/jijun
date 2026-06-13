## 1. Data Layer — Schema Migration & CRUD

- [ ] 1.1 Bump `dbVersion` from 12 to 13 in `dataService.js` and add `categoryGroups` object store creation in the `upgrade` callback with fields: `id`, `uuid`, `ledgerId`, `type`, `name`, `icon`, `color`, `order`, `isSystem`, `key` (nullable string for default groups), `createdAt`; add indexes on `uuid` (unique), `ledgerId`, `type`
- [ ] 1.2 Seed default category groups in the upgrade callback with the following `key` values:
  - Expense: 餐飲(`dining`), 生活(`living`), 交通(`transport`), 娛樂(`entertainment`), 醫療(`medical`), 教育(`education`), 金融(`finance`), 其他(`other`)
  - Income: 薪資(`salary`), 額外收入(`extra_income`), 投資(`investment`), 金融(`finance_income`), 其他(`other_income`)
  — each with icon, color, `order`, and `isSystem: true`; `key` set to the stable identifier; custom groups leave `key = null`
- [ ] 1.3 Add `addCategoryGroup(groupData)` CRUD method to DataService with UUID generation, `ledgerId` auto-fill, `key=null` for non-system groups, and `logChange` sync tracking
- [ ] 1.4 Add `getCategoryGroups(filters)` method with support for `{ type, ledgerId, allLedgers }` filters and ordering by `order` field
- [ ] 1.5 Add `getCategoryGroup(id)` single-lookup method
- [ ] 1.6 Add `updateCategoryGroup(id, updates)` method preserving `isSystem`, `key`, and `createdAt`
- [ ] 1.7 Add `deleteCategoryGroup(id)` method that checks for category references first and fails with a message if categories still reference the group
- [ ] 1.8 Auto-assign existing custom categories (from `custom_categories` setting) without a `groupId` to a fallback "自訂" group during migration

## 2. Sync Integration for categoryGroups

- [ ] 2.1 Add `'categoryGroups'` to the `topoOrder` array in `syncService.js` after `'recurring_transactions'` and before `'custom_categories'`
- [ ] 2.2 Add `_applyAdd` / `_applyUpdate` / `_applyDelete` handlers in `syncService.js` for `categoryGroups` storeName (including per-ledger variants `categoryGroups_{ledgerId}`) — delegate to `dataService` CRUD methods with `skipLog: true`
- [ ] 2.3 Verify that `logChange` calls in `dataService.js` categoryGroups CRUD methods produce correctly formatted sync log entries

## 3. Category Model — Add groupId to Categories

- [ ] 3.1 Add `groupId` field to each default category in `categories.js` mapping to the appropriate default group `key` (e.g., `food → "dining"`, `traffic → "transport"`, `salary → "salary"`)
- [ ] 3.2 Update `CategoryManager.addCustomCategory()` to accept and store an optional `groupId` field
- [ ] 3.3 Update `CategoryManager.init()` to load `categoryGroups` from DataService into an in-memory cache
- [ ] 3.4 Add `CategoryManager.getGroupedCategories(type)` method that returns `[{ group: {name, icon, color, key, uuid}, categories: [cat1, ...] }, ...]` with matching logic: `category.groupId === group.key || category.groupId === group.uuid`; unmatched categories go under a synthetic "未分類" group
- [ ] 3.5 Keep `CategoryManager.getAllCategories(type)` returning a flat array for backward compatibility with dropdown consumers
- [ ] 3.6 Update all flat-array consumers to use `getGroupedCategories()` where appropriate:
  - `addPage.js` → switch to `getGroupedCategories()` for grid rendering
  - `statistics.js` → use `getGroupedCategories()` in group mode
  - `recordsList.js` → use `getGroupedCategories()` for group filter

## 4. Category Picker UI — Group Headers in addPage

- [ ] 3.1 Update `renderCategories` in `addPage.js` to iterate over groups and render collapsible group headers (icon, name, toggle arrow) with categories under each header in a 4-column sub-grid
- [ ] 3.2 Implement collapse/expand toggle for group sections with smooth CSS transition
- [ ] 3.3 Persist collapse state per group+type+ledger in localStorage; restore on page load
- [ ] 3.4 Keep "管理" button at the bottom of the full category grid

## 5. Group Management UI

- [ ] 5.1 Add a "管理群組" button to the category management modal (`showManageCategoriesModal`) that opens a new group management modal
- [ ] 5.2 Implement group management modal: list all groups for the current type showing icon, name, color; allow reordering via Sortable.js drag-and-drop
- [ ] 5.3 Implement "新增群組" flow: modal with name input, Font Awesome icon selector, color selector; on save, call `addCategoryGroup`
- [ ] 5.4 Implement "編輯群組" flow: pre-filled modal with same fields as creation; on save, call `updateCategoryGroup`
- [ ] 5.5 Implement "刪除群組" flow: confirmation dialog; blocked if categories still reference this group (show which categories)
- [ ] 5.6 Add group selector dropdown to the "新增/編輯分類" modal (`showAddCategoryModal`) — populate from `categoryGroups` for current type; default to "自訂" group

## 6. Category Consumers — Update Dropdown Users

- [ ] 6.1 Update `recurringPage.js` — `getAllCategories()` calls continue using flat array (no change needed, but verify `getCategoryById` still works with `groupId` field present)
- [ ] 6.2 Update `amortizationModal.js` — `getAllCategories()` calls continue using flat array (no change needed, but verify)
- [ ] 6.3 Update `quickSelectManager.js` — verify `getCategoryById()` still returns correct category objects with `groupId` field; no rendering change needed
- [ ] 6.4 Update `pluginManager.js` — keep `getCategories` exposed as flat array; add new `getCategoryGroups(type)` exposing `getGroupedCategories()` result

## 7. Statistics Integration

- [ ] 7.1 Add a "依群組顯示" toggle button to the statistics page UI
- [ ] 7.2 When group mode is active, aggregate expense/income data by group (sum of all categories in each group) via `getGroupedCategories()` category-to-group mapping
- [ ] 7.3 Render donut chart slices by group; on slice click, drill down to individual categories within that group
- [ ] 7.4 Update the category breakdown list to show categories nested under group headers in group mode

## 8. Budget Integration

- [ ] 8.1 Add group-level budget input fields in the budget settings UI alongside existing category-level budgets
- [ ] 8.2 Update `BudgetManager.saveBudget()` and `loadBudget()` to persist and load group-level budget targets
- [ ] 8.3 When displaying budget progress, aggregate category spending under each group and show progress bars at both group and category levels

## 9. Records List — Group Filter

- [ ] 9.1 Add group filter UI to the records list page (dropdown populated from `getGroupedCategories()` showing available groups for the selected type)
- [ ] 9.2 When a group is selected, filter records whose category belongs to that group; combine with existing filters (type, date, category, search)

## 10. Export/Import — Groups Support

- [ ] 10.1 Add `categoryGroups` array to `exportData()` output — include all fields (id, uuid, ledgerId, type, name, icon, color, order, isSystem, key, createdAt)
- [ ] 10.2 Update `importData()` to handle `categoryGroups` in the import JSON: remap UUIDs to new auto-increment IDs (same pattern as ledgers), create a group ID mapping
- [ ] 10.3 During import, remap `groupId` references on custom categories (from `custom_categories` setting) using the group UUID mapping
- [ ] 10.4 Handle legacy imports (pre-v13 without `categoryGroups`): auto-create "未分類" group and assign all categories to it

## 11. Test Updates

- [ ] 11.1 Update `tests/unit/categories.test.js` — verify each default category has a valid `groupId` string; update `CATEGORIES` structure tests to include `groupId` field
- [ ] 11.2 Update `tests/unit/budgetManager.test.js` — update mocks to reflect any API changes; add test for group-level budget loading/saving
- [ ] 11.3 Update `tests/unit/pluginManager.test.js` — add test for `getCategoryGroups` plugin API; verify `getCategories` still returns flat array
