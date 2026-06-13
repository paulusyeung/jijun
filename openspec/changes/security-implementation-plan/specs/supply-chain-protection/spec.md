## ADDED Requirements

### Requirement: Plugin ID format enforced

The `PluginStorage` constructor SHALL reject plugin IDs that do not match the pattern `/^[a-zA-Z0-9._-]+$/` by throwing an error. Existing plugins with non-conforming IDs SHALL be migrated by sanitizing their ID on first load after update (replace non-conforming characters with `_`).

#### Scenario: Invalid plugin ID rejected
- **WHEN** a plugin with ID `"../../evil"` is installed
- **THEN** `new PluginStorage("../../evil", dataService)` SHALL throw an error

### Requirement: Plugin install integrity verification

When installing a plugin from the store, the system SHALL verify the SHA-256 hash of the downloaded script against a `sha256` field declared in the store's `index.json` entry. If the hash does not match, the installation SHALL be aborted.

#### Scenario: Tampered plugin download detected
- **WHEN** the downloaded plugin script's SHA-256 hash does not match the store's declared hash
- **THEN** the system SHALL abort installation and display an error message
