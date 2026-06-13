## ADDED Requirements

### Requirement: Statistics aggregation by group
`StatisticsManager.renderStatisticsPage()` SHALL support a toggle/option to group expense/income breakdowns by group instead of by individual category. When group mode is active:
- The donut chart slices represent groups (sum of all categories in that group)
- The category breakdown list groups items under group headers
- The total values remain unchanged

#### Scenario: Statistics show group-level aggregation
- **WHEN** a user enables "依群組顯示" toggle on the statistics page
- **THEN** the expense distribution chart SHOWs slices for each group (e.g., "餐飲" aggregating 飲食+飲料); the category detail list nests categories under their group headers

#### Scenario: Group level detail shows sub-categories
- **WHEN** a user taps/clicks on a group slice in the donut chart
- **THEN** the display transitions to show the individual categories within that group and their respective amounts

### Requirement: Budget targets at group level
`BudgetManager` SHALL support budget targets at the group level. The budget settings UI SHALL allow setting a budget for a group (which implicitly covers all categories in that group). Group-level budgets SHALL display alongside category-level budgets. The budget progress bar SHALL aggregate spending across all categories in the group.

#### Scenario: Set group budget
- **WHEN** a user sets a monthly budget of $5,000 for the "餐飲" group
- **THEN** spending across all categories in the "餐飲" group (飲食, 飲料, etc.) counts toward that $5,000 limit; the budget progress bar reflects the aggregate

#### Scenario: Group budget display
- **WHEN** viewing budget overview
- **THEN** group budgets are displayed with their aggregated spending; collapsing a group shows individual category budgets within

### Requirement: Records filter by group
`RecordsListManager` SHALL support filtering records by group name/ID. The filter UI SHALL show available groups for the current type. When a group filter is active, only records whose category belongs to that group are shown.

#### Scenario: Filter records by group
- **WHEN** a user selects a group filter on the records list page
- **THEN** only records whose `category` field resolves to a category within the selected group are displayed

### Requirement: Plugin API exposes grouped categories
`PluginManager` SHALL expose category groups via the plugin API. The existing `getCategories(type)` method SHALL continue returning a flat array (backward compatible). A new `getCategoryGroups(type)` method SHALL be added that returns the group-aware structure from `CategoryManager.getGroupedCategories(type)`.

#### Scenario: Plugin gets flat categories (backward compat)
- **WHEN** a plugin calls `api.getCategories('expense')`
- **THEN** the result is a flat array of category objects with the same format as before (no change)

#### Scenario: Plugin gets grouped categories
- **WHEN** a plugin calls `api.getCategoryGroups('expense')`
- **THEN** the result is an array of `{ group: {...}, categories: [...] }` objects

### Requirement: Export/Import includes groups
The `exportData()` function SHALL include `categoryGroups` in the export JSON (array of all group objects). The `importData()` function SHALL:
- Accept legacy exports (pre-v13) — auto-assign categories to "未分類" group
- Apply UUID-based ID remapping (same pattern as ledgers) for group IDs

#### Scenario: Export includes groups
- **WHEN** a user exports data after v13 migration
- **THEN** the export JSON contains a `categoryGroups` array with all group objects (including UUIDs)

#### Scenario: Import v13+ data preserves groups
- **WHEN** a user imports a v13+ export file with groups
- **THEN** all groups are recreated in the target database with new auto-increment IDs; categories' `groupId` references are remapped to match; existing groups with matching UUIDs are updated

#### Scenario: Import pre-v13 data assigns fallback group
- **WHEN** a user imports an export file that does not contain `categoryGroups`
- **THEN** all categories are assigned to the "未分類" group (created automatically)
