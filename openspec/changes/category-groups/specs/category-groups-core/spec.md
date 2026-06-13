## ADDED Requirements

### Requirement: Data Model — categoryGroups object store
The system SHALL create a `categoryGroups` object store in IndexedDB at schema version 13 with fields: `id` (auto-increment PK), `uuid` (unique), `ledgerId`, `type` (expense/income), `name`, `icon`, `color`, `order` (number), `isSystem` (boolean), `key` (nullable string — stable identifier for default groups), `createdAt` (timestamp).
The store SHALL have indexes on `uuid` (unique), `ledgerId`, and `type`.

#### Scenario: Store creation on schema upgrade
- **WHEN** IndexedDB upgrades from version 12 to 13
- **THEN** the `categoryGroups` object store SHALL be created with the specified fields and indexes

#### Scenario: Default groups are seeded with correct keys
- **WHEN** schema upgrade to v13 completes
- **THEN** the following groups SHALL exist with `isSystem: true` and the specified `key` values:
  - Expense: 餐飲(`dining`), 生活(`living`), 交通(`transport`), 娛樂(`entertainment`), 醫療(`medical`), 教育(`education`), 金融(`finance`), 其他(`other`)
  - Income: 薪資(`salary`), 額外收入(`extra_income`), 投資(`investment`), 金融(`finance_income`), 其他(`other_income`)

#### Scenario: Custom groups have key = null
- **WHEN** a user creates a new custom group via `addCategoryGroup()`
- **THEN** the group's `key` field SHALL be `null`; its `uuid` SHALL be a valid UUID v4 string

### Requirement: CRUD operations for category groups
The system SHALL provide `addCategoryGroup`, `getCategoryGroups`, `getCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup` methods on DataService. Deletion SHALL fail (or warn) if categories still reference the group.
`getCategoryGroups(filters)` SHALL accept `{ type, ledgerId, allLedgers }` and filter accordingly.
Each group SHALL auto-generate a UUID if not provided.

#### Scenario: Add a new group
- **WHEN** `addCategoryGroup({ type: 'expense', name: '寵物', icon: 'fas fa-dog', color: 'bg-amber-400' })` is called
- **THEN** a new group is created with auto-increment `id`, a generated `uuid`, `ledgerId` set to `activeLedgerId`, and `isSystem: false`

#### Scenario: Get groups filtered by type
- **WHEN** `getCategoryGroups({ type: 'expense' })` is called
- **THEN** only expense-type groups for the active ledger are returned, ordered by the `order` field

#### Scenario: Delete a group with assigned categories is blocked
- **WHEN** `deleteCategoryGroup(groupId)` is called and one or more categories have this `groupId`
- **THEN** the operation SHALL fail with a descriptive error message

#### Scenario: Update a group
- **WHEN** `updateCategoryGroup(id, { name: '新名稱', icon: 'fas fa-star' })` is called
- **THEN** only the specified fields on the group are updated; `isSystem` and `createdAt` remain unchanged

### Requirement: Default categories gain `groupId`
Each default category in `categories.js` SHALL include a `groupId` field matching one of the seeded default groups (e.g., `{ id: 'food', name: '飲食', groupId: 'dining', ... }`).

#### Scenario: Default expense categories map to groups
- **WHEN** the app loads after migration
- **THEN** each default expense category has a `groupId` that matches an existing expense group

### Requirement: Custom categories support `groupId`
The `CategoryManager.addCustomCategory()` SHALL accept and store an optional `groupId` field. When omitted during creation, the system SHALL auto-assign the category to the generic "自訂" group for that type (creating it if needed).
`CategoryManager.showAddCategoryModal()` SHALL include a group selector dropdown.

#### Scenario: Create custom category with group
- **WHEN** a user creates a custom category and selects a group from the dropdown
- **THEN** the category object includes the selected group's UUID as its `groupId`

#### Scenario: Create custom category without group
- **WHEN** a user creates a custom category without selecting a group
- **THEN** the category is auto-assigned to the "自訂" group for that type

### Requirement: `getAllCategories()` retains flat-array backward compatibility
`CategoryManager.getAllCategories(type)` SHALL continue to return a flat array of all categories (default + custom) for the given type, sorted by `categoryOrder`. This ensures backward compatibility with dropdown consumers.

### Requirement: `getGroupedCategories()` returns categories organized by group
`CategoryManager.getGroupedCategories(type)` SHALL return an array of objects `[{ group: { name, icon, color, key, uuid }, categories: [cat1, cat2, ...] }, ...]` where categories are organized under their respective group, and each group retains its metadata.

The matching logic SHALL: for each category, find the first group where `category.groupId === group.key || category.groupId === group.uuid`. Categories with no matching group SHALL be collected under a synthetic "未分類" group.

#### Scenario: Categories grouped by groupId
- **WHEN** `getGroupedCategories('expense')` is called after migration
- **THEN** the result groups categories under their matching group headers; each default category's `groupId` matches the group's `key`; categories with no matching group appear under "未分類"

### Requirement: Group management UI
The system SHALL provide a group management interface accessible from the category management modal. It SHALL allow:
- Viewing all groups for a type (expense/income) with name, icon, color
- Creating a new group (name, icon selector, color selector)
- Editing an existing group's name, icon, or color
- Deleting a group (blocked if categories are assigned)
- Reordering groups via drag-and-drop (same Sortable.js pattern as categories)

#### Scenario: Open group management
- **WHEN** a user clicks "管理群組" from the category management modal
- **THEN** a new modal opens listing all groups for the current type with name, icon, and color; groups with `isSystem: true` are not deletable

#### Scenario: Create group assigns UUID
- **WHEN** a user fills in name, selects icon and color, and clicks "新增群組"
- **THEN** a new group is created with `isSystem: false` and a generated UUID; it appears in the group list immediately

### Requirement: Category picker renders groups
In `addPage.js`, the category grid SHALL render categories under collapsible group headers. Each group header SHOWs the group icon, name, and a collapse/expand toggle. Below the header, categories belonging to that group render in a 4-column grid (same layout as current, but scoped to that group). A "管理" button remains at the bottom of the full grid.

#### Scenario: View categories under group headers
- **WHEN** the add-record page loads for expense type
- **THEN** categories are displayed under group headers (e.g., "餐飲", "交通") with each group collapsible by tapping the header

#### Scenario: Collapse state persists
- **WHEN** a user collapses a group header, then navigates away and back
- **THEN** the collapsed state for that group+type+ledger combination is restored from localStorage

### Requirement: Sync integration for categoryGroups
The `syncService.js` SHALL support syncing the `categoryGroups` store across devices. The `topoOrder` array SHALL include `'categoryGroups'` after `'recurring_transactions'` and before `'custom_categories'`. The `_applyAdd()` handler SHALL handle `categoryGroups` storeName (including per-ledger variants `categoryGroups_{ledgerId}`) by mapping remote data to the local `dataService` CRUD methods.

#### Scenario: categoryGroups in topoOrder
- **WHEN** sync applies remote changes
- **THEN** `categoryGroups` changes are ordered after `recurring_transactions` and before `custom_categories` in the topological sort

#### Scenario: Apply remote add for categoryGroups
- **WHEN** sync receives an add-change for storeName `categoryGroups` with group data
- **THEN** the group is added via `dataService.addCategoryGroup()` with `skipLog: true` to prevent re-logging

### Requirement: Schema migration v12→v13
The `DataService.init()` upgrade callback SHALL:
1. Create the `categoryGroups` store
2. Seed default groups
3. Load existing `custom_categories` from settings, find those without a `groupId`, and assign them to the "自訂" group
4. Log the migration in `console.info`

#### Scenario: Automatic migration
- **WHEN** IndexedDB schema upgrades from v12 to v13
- **THEN** all existing custom categories from `custom_categories` setting get assigned a fallback "自訂" group; existing records are unchanged; the operation completes without user interaction

### Requirement: Test coverage for category groups
The test suite SHALL be updated to cover the new group-aware behavior. `tests/unit/categories.test.js` SHALL validate that default categories include a valid `groupId`. `tests/unit/budgetManager.test.js` SHALL update mocks to use the new `getGroupedCategories()` signature where applicable. `tests/unit/pluginManager.test.js` SHALL validate that the exposed `getCategories` plugin API still returns a flat array.

#### Scenario: Default category has groupId
- **WHEN** `categories.test.js` iterates over `CATEGORIES[type]`
- **THEN** each category object SHALL have a truthy `groupId` string

#### Scenario: Plugin API returns flat array
- **WHEN** a plugin calls `getCategories('expense')`
- **THEN** the result is a flat array of category objects (backward-compatible)
