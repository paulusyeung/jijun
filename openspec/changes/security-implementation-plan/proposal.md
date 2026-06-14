## Why

The application has 104+ stored XSS sinks via `innerHTML`, an escapable plugin sandbox, plaintext OAuth token storage, no CSP headers, and missing transport security — collectively enabling full user data compromise through a single crafted input. These issues must be fixed before the app can be considered production-safe.

## What Changes

- Add centralized HTML attribute and content sanitization utilities; apply `escAttr()` to every user-data `innerHTML` sink across all pages
- Sanitize SVG theme content before DOM insertion (strip event handlers, script/object/iframe elements)
- Harden plugin sandbox from Proxy-based isolation to iframe-based isolation with `postMessage` communication
- Add OAuth `state` parameter validation for CSRF protection on token exchange
- Encrypt OAuth tokens at rest using Web Crypto PBKDF2
- Add optimistic locking (ETag/If-Match) to shared ledger sync file updates
- Implement CSP meta tag restricting script/connect/frame sources
- Add subresource integrity (SRI) hashes to all CDN-loaded resources
- Add rate limiting to the sync server's token endpoints
- Remove error detail leakage from server error responses
- Fix Docker CORS default from wildcard (`*`) to explicit origins-only
- Add ServiceWorker message origin validation
- Enforce plugin ID format validation
- Move ad-free status tracking from localStorage to IndexedDB
- Fix manifest.json scope from `../` to `/`
- Keep `showToast()` as a plain-text rendering boundary and audit callers to prevent XSS through server error responses without double-escaping
- Add plugin install integrity verification (hash/signature check on plugin scripts)
- Audit imported data flows and fix render sinks instead of mutating imported records at storage time
- Sanitize `customConfirm` modal rendering to prevent XSS via user-supplied content

## Capabilities

### New Capabilities
- `output-sanitization`: Centralized HTML escaping and SVG sanitization applied to all user-data rendering paths, eliminating stored XSS
- `render-boundary-safety`: Plain-text UI helpers and imported-data flows use a single escaping boundary at DOM insertion time, avoiding double-escaping and data corruption
- `plugin-isolation`: iframe-based sandbox with `postMessage` communication replacing the current Proxy-based approach, preventing sandbox escape
- `sync-security`: OAuth CSRF protection via state parameter, encrypted token storage, and optimistic locking for shared ledger file updates
- `csp-enforcement`: Content Security Policy meta tag restricting script sources, connection targets, and frame ancestors
- `server-security`: Rate limiting on OAuth token endpoints, removal of error detail leakage, and strict CORS defaults
- `supply-chain-protection`: SRI hashes on CDN resources and plugin install integrity verification
- `service-worker-security`: Origin validation on incoming `postMessage` events

### Modified Capabilities
*(none — no existing specs in `openspec/specs/`)*

## Impact

- **src/js/utils.js**: New `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()`, `sanitizeText()`, `deriveDeviceKey()`, `encryptData()`, `decryptData()` functions
- **All page components** (`src/js/pages/*.js`, `debtManager.js`, `recordsList.js`, `statistics.js`): Every `innerHTML` template that interpolates user data must wrap variables with `escAttr()`
- **src/js/dataService.js**: Import paths remain storage-oriented; imported fields stay raw and downstream render sinks enforce sanitization
- **src/js/pluginManager.js**: Plugin loading refactored from Blob URL import to iframe sandbox; context API changed to `postMessage`-based
- **src/js/pluginStorage.js**: Plugin ID validation enforced (throw instead of warn)
- **src/js/syncService.js**: OAuth state management, token encryption/decryption, ETag-based optimistic locking
- **src/js/themeManager.js**: SVG sanitization before DOM insertion
- **src/js/rewardService.js**: Ad-free tracking moved to IndexedDB
- **server/src/index.js**: Rate limiting added; error response bodies sanitized
- **server/docker-compose.yml**: CORS default changed
- **index.html**: CSP meta tag added; `integrity` attributes added to CDN tags
- **public/serviceWorker.js**: Origin check on message handler
- **manifest.json**: Scope corrected

## Audit Notes (Added During Review)

### Token Encryption Threat Model Clarification
The encryption key is derived from `deviceId` (stored in plaintext `localStorage`, see `dataService.js:14`) + a random salt. This means:
- **Protects against**: Stolen backup files, device disposal, casual database dumps (attacker has data but can't run JS)
- **Does NOT protect against**: In-browser XSS — any script can read `localStorage.sync_device_id` and the salt from IndexedDB, then derive the same key
- The proposal should honestly frame this as **defense-in-depth against storage theft**, not against plugin sandbox escapes or XSS

### Plugin Sandbox Complexity Underestimated
Every current context API call (`context.data.getRecords()`, `context.ui.showToast()`, `context.storage.getItem()`) will become an asynchronous `postMessage` round-trip. This is a **breaking change** for all existing plugins. Specific concerns:
- `PluginStorage` does debounced DB writes — proxying through `postMessage` adds latency to every read
- `context.ui.navigateTo()` requires the iframe to tell the parent to change `window.location.hash`
- The migration shim must handle the Promise-based API transparently

### `sanitizeHTML` vs `escAttr` Design Flaw
The spec treats `sanitizeHTML` and `escAttr` as the same operation. They are not:
- `escAttr(str)` — Escapes ALL HTML (uses `textContent`→`innerHTML`). Correct for attribute values.
- `sanitizeHTML(str)` — Strips dangerous tags while preserving safe HTML (uses DOMParser + whitelist). Different mechanism entirely.
- If `sanitizeHTML` is implemented using `textContent`, it would destroy legitimate formatting like `<b>bold</b>` text.

### CSP Must Come After All XSS Fixes
Adding CSP before all `innerHTML` sinks are fixed will break legitimate app functionality. Task 13 (CSP) must be explicitly ordered after Task 7 (automated audit + remaining fixes).

### Client-Side Error XSS Missing
`showToast()` in `utils.js` renders messages in the DOM. The correct mitigation is to keep that helper on `textContent` and pass raw strings into it; pre-sanitizing before the call would double-escape safe messages and display entities literally.

### Import-path sanitization boundary clarification
The original tasks suggested sanitizing imported contact names, descriptions, and category names while storing them. That would mutate user data and create double-escaping once those values later flow through `escAttr()` at render time. The safer boundary is: keep imported data raw in storage, and ensure every `innerHTML` or attribute sink escapes on output.

### Plugin Install Integrity Not Implemented
The `supply-chain-protection` capability spec mentions "plugin install integrity verification" but no corresponding task exists. Plugins are stored as raw JS strings in IndexedDB with no hash or signature verification. A malicious plugin could exfiltrate all financial data.
