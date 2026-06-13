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

## Capabilities

### New Capabilities
- `output-sanitization`: Centralized HTML escaping and SVG sanitization applied to all user-data rendering paths, eliminating stored XSS
- `plugin-isolation`: iframe-based sandbox with `postMessage` communication replacing the current Proxy-based approach, preventing sandbox escape
- `sync-security`: OAuth CSRF protection via state parameter, encrypted token storage, and optimistic locking for shared ledger file updates
- `csp-enforcement`: Content Security Policy meta tag restricting script sources, connection targets, and frame ancestors
- `server-security`: Rate limiting on OAuth token endpoints, removal of error detail leakage, and strict CORS defaults
- `supply-chain-protection`: SRI hashes on CDN resources and plugin install integrity verification
- `service-worker-security`: Origin validation on incoming `postMessage` events

### Modified Capabilities
*(none — no existing specs in `openspec/specs/`)*

## Impact

- **src/js/utils.js**: New `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()`, `deriveDeviceKey()`, `encryptData()`, `decryptData()` functions
- **All page components** (`src/js/pages/*.js`, `debtManager.js`, `recordsList.js`, `statistics.js`): Every `innerHTML` template that interpolates user data must wrap variables with `escAttr()`
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
