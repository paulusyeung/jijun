## ADDED Requirements

### Requirement: Plugin code runs in sandboxed iframe

The system SHALL execute plugin JavaScript inside an `<iframe>` element with attribute `sandbox="allow-scripts"`. The iframe SHALL NOT have `allow-same-origin`. The iframe SHALL be hidden from the user (display: none).

#### Scenario: Plugin cannot access parent globals
- **WHEN** a plugin calls `parent.document`, `parent.localStorage`, or `parent.indexedDB`
- **THEN** the call SHALL throw a SecurityError or return undefined

#### Scenario: Plugin cannot use fetch/XHR
- **WHEN** a plugin calls `fetch()` or `new XMLHttpRequest()`
- **THEN** the call SHALL fail with a network error (sandboxed iframe has no network access by default)

### Requirement: Plugin context is communicated via postMessage

The system SHALL provide the plugin's `init()` function access to the application API via `window.addEventListener('message', ...)` with structured clone serialization. The API object SHALL contain the same `storage`, `data`, `ui`, `events`, `hooks`, and `lib` namespaces as the current implementation.

#### Scenario: Plugin receives context on init
- **WHEN** a plugin's `init` function is called
- **THEN** the plugin SHALL receive a `context` object via a `message` event from the parent window
- **THEN** the context SHALL contain `context.storage`, `context.data`, `context.ui`, `context.events`, `context.lib`, `context.appName`, `context.version`

### Requirement: Storage accesses are proxied through parent

The plugin's `context.storage` API SHALL communicate with the parent frame via `postMessage` requests. The parent SHALL validate the request origin and process the IndexedDB read/write before sending the response back. Each storage call SHALL be async (Promise-based).

#### Scenario: Plugin read and write via postMessage
- **WHEN** a plugin calls `await context.storage.getItem('myKey')`
- **THEN** the system SHALL retrieve the value from the parent's IndexedDB (PluginStorage) and return it
- **WHEN** a plugin calls `await context.storage.setItem('myKey', 'myValue')`
- **THEN** the system SHALL store the value in the parent's IndexedDB
