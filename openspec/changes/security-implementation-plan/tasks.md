## Phase 1: Foundation — Sanitization + Automated Audit + Client-Side XSS (Tasks 1-9)

### 1. Sanitization Utilities + Unit Tests

- [x] 1.1 Add `escAttr(str)` function to `src/js/utils.js` (escapes & " ' < > via `textContent`→`innerHTML` trick — for attribute value contexts)
- [x] 1.2 Add `sanitizeHTML(str)` function to `src/js/utils.js` (strips dangerous elements via DOMParser + element/attribute whitelist — **NOT** `textContent`-based; preserves safe HTML like `<b>`, `<i>`)
- [x] 1.3 Add `sanitizeSVG(svgString)` function to `src/js/utils.js` (strips event handlers, javascript: URIs, script/object/iframe/embed elements via DOM traversal + SVG element whitelist)
- [x] 1.4 Add `sanitizeText(str)` function to `src/js/utils.js` (alias for `escapeHTML()` — for rendering error messages safely in `showToast()` and other UI)
- [x] 1.5 Export all four functions from `src/js/utils.js`
- [x] 1.6 Write unit tests for `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()`, `sanitizeText()` — cover known XSS payloads (`<img src=x onerror=...>`, `javascript:`, event handlers, attribute injection, safe HTML preservation)

### 2. Fix XSS in debtManager.js

- [x] 2.1 Fix contact name rendering at `debtManager.js:297` — wrap `contact.name` with `escAttr()`
- [x] 2.2 Fix debt description rendering at `debtManager.js:315,325` — wrap `debt.description` with `escAttr()`
- [x] 2.3 Fix attribute injection at `debtManager.js:692` — wrap with `escAttr()` in `value="..."` interpolation
- [x] 2.4 Fix textarea content at `debtManager.js:808` — wrap `contactName` and `debt.description` with `escAttr()`

## 3. Fix XSS in recordsList.js

- [x] 3.1 Fix category name at `recordsList.js:508` — wrap `category?.name` with `escAttr()`
- [x] 3.2 Fix record description at `recordsList.js:513` — wrap `record.description` with `escAttr()`
- [x] 3.3 Fix category filter modal at `recordsList.js:621,628` — wrap `category.name` with `escAttr()`
- [x] 3.4 Fix account filter modal at `recordsList.js:667` — wrap `account.name` with `escAttr()`

## 4. Fix XSS in statistics.js

- [x] 4.1 Fix record description interpolation at `statistics.js:263` — wrap `r.description` and `categoryName` with `escAttr()`

## 5. Fix XSS in Store and Theme Store pages

- [x] 5.1 Fix plugin name/description/author at `storePage.js:79` — wrap `p.name`, `p.description`, `p.author` with `escAttr()`
- [x] 5.2 Fix theme name/description at `themeStorePage.js:87-89` — wrap `t.name`, `t.description` with `escAttr()`

## 6. Fix Theme SVG Injection

- [x] 6.1 Add SVG sanitization call before `template.innerHTML` assignment in `themeManager.js:144`
- [x] 6.2 Apply `sanitizeSVG()` to `replacementInfo.svg` before DOM insertion

## 7. Automated XSS Sink Audit + Remaining Fixes

- [x] 7.1 Create ESLint custom rule or AST walker script to scan all `innerHTML` assignments in `src/js/pages/*.js` for unescaped user data
- [x] 7.2 Run the scanner, generate a checklist of sinks that need remediation
- [x] 7.3 Apply `escAttr()` to any missed sinks identified by the automated audit
- [x] 7.4 Add the ESLint rule to CI/lint pipeline as a regression gate

## 8. Client-Side Error Message Sanitization

- [x] 8.1 Audit `showToast()` in `src/js/utils.js` — ensure it uses `textContent` (not `innerHTML`) to render messages
- [x] 8.2 Keep `showToast()` as the single plain-text escaping boundary: audit sync-related error flows and ensure callers pass raw strings instead of pre-sanitized text that would double-escape in the UI
- [x] 8.3 Audit all `showToast()` call sites across the codebase to ensure no user-controlled strings are rendered unsanitized
- [x] 8.4 Audit `customConfirm()` / `customAlert()` in `src/js/utils.js` — ensure modal content is rendered safely

## 9. Export/Import XSS Audit

- [x] 9.1 Audit data import path in `dataService.js` — verify imported record fields (contact names, descriptions, category names) remain raw in storage and are sanitized at render sinks before insertion into `innerHTML`
- [x] 9.2 Remediate any import-adjacent render sinks identified by the audit; do not mutate imported user data during import with `sanitizeText()` or `escapeHTML()`

---

## Phase 2: Hardening — Plugin Sandbox + Sync Security (Tasks 10-16)

### 10. Plugin Sandbox Hardening (Feature-Flagged)

- [x] 10.1 Add feature flag `settings.pluginSandboxV2` to IndexedDB settings store (default: `false`)
- [x] 10.2 Refactor `pluginManager.js:loadPlugin()` to create a sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`) when flag is enabled
- [x] 10.3 Refactor `pluginManager.js:createPluginContext()` to use `postMessage` for parent-plugin communication with unique channel UUID per plugin instance
- [x] 10.4 Add `postMessage` event listener in plugin context handler with channel ID validation (not origin-based, since iframe is `about:blank`)
- [x] 10.5 Update `PluginStorage` to proxy reads/writes through the parent frame via `postMessage`
- [x] 10.6 Add migration shim for legacy plugins (auto-wraps old context API for 6 months; logs deprecation warning)
- [x] 10.7 Add fallback logic: if iframe creation fails or flag is disabled, revert to legacy Proxy sandbox
- [ ] 10.8 Smoke test top 5 most-used plugins against new iframe sandbox

### 11. Sync Security — OAuth State

- [x] 11.1 Generate and store `state` parameter in `syncService.js:_signInWeb()` using `crypto.randomUUID()`
- [x] 11.2 Validate returned `state` in `syncService.js:handleAuthCallback()` before token exchange
- [x] 11.3 Add `state` parameter to native sign-in path in `syncService.js:_signInNative()`

## 12. Sync Security — Token Encryption

- [x] 12.1 Add `deriveDeviceKey()`, `encryptData()`, `decryptData()` functions to `src/js/utils.js` using Web Crypto API (PBKDF2 + AES-GCM)
- [x] 12.2 Encrypt tokens before save in `syncService.js:saveTokens()`
- [x] 12.3 Decrypt tokens on load in `syncService.js:init()` with lazy migration for existing plaintext tokens (try decrypt, fall back to parse JSON, re-encrypt)
- [ ] 12.4 Write unit test for token encryption round-trip

### 13. Sync Security — Optimistic Locking

- [x] 13.1 Return ETag from `_findFile()` in `syncService.js:1141`
- [x] 13.2 Return ETag from `_downloadFile()` in `syncService.js:1176`
- [x] 13.3 Add `If-Match` header to `_updateFile()` in `syncService.js:1351`
- [x] 13.4 Handle 412 PreconditionFailed in `pushSharedLedgerChanges()` — re-download, re-merge, retry
- [x] 13.5 Clarify merge logic: verify that existing full-comparison merge handles re-applying local changes on top of fresh download after 412 retry

## 14. Server Security

- [x] 14.1 Add rate limiting (10 req/60s per IP) to `server/src/index.js:handleTokenExchange()` and `handleTokenRefresh()`
- [x] 14.2 Remove `details: data` from error responses in `server/src/index.js:93,134`
- [x] 14.3 Change Docker CORS default from `*` to empty string in `docker-compose.yml:10`

## 15. CSP and Transport Security

> **⚠ Ordering constraint**: CSP must be added AFTER all XSS fixes (Tasks 2-9) are complete. Adding CSP before fixing `innerHTML` sinks will break legitimate app functionality.

- [x] 15.1 Add `<meta http-equiv="Content-Security-Policy">` to `index.html` with restrictive `script-src`, `connect-src`, `frame-src`, `object-src`, `base-uri`
- [x] 15.2 Generate SHA-384 hashes and add `integrity` attributes to all CDN `<script>` and `<link>` tags in `index.html`

## 16. ServiceWorker Security

- [x] 16.1 Add origin validation in `public/serviceWorker.js:216` — reject messages where `event.origin !== self.location.origin`

## 17. Plugin Install Integrity

- [x] 17.1 Add SHA-256 hash verification at plugin install time — compute hash of plugin script, compare against expected hash from plugin store metadata
- [x] 17.2 Store plugin script hash in IndexedDB alongside plugin data for tamper detection on load
- [x] 17.3 Warn user if plugin script hash does not match stored hash on plugin load (possible tampering)
- [x] 17.4 Document as known limitation: plugin store is the trust boundary; hash verification prevents local tampering, not compromised store

## 18. Additional Hardening

- [x] 18.1 Enforce plugin ID format in `pluginStorage.js:19` — throw error instead of console.warn
- [x] 18.2 Move ad-free status tracking from `localStorage` to IndexedDB in `rewardService.js:197-203`
- [ ] 18.3 Fix manifest scope from `"../"` to `"/"` in `manifest.json:14`

## 19. Verification

- [x] 19.1 Run `npm run lint` — confirm no new warnings
- [ ] 19.2 Run `npm test` — confirm all existing tests pass
- [ ] 19.3 Manual XSS test: create contact with `<img src=x onerror=alert(1)>`, verify no alert
- [ ] 19.4 Manual XSS test: apply malicious theme SVG, verify no script execution
- [ ] 19.5 Manual sync test: sign in with Google, verify tokens encrypted in IndexedDB
- [ ] 19.6 Manual sync test: two devices edit same shared ledger, verify no data loss
- [ ] 19.7 Verify CSP blocks external fetch via DevTools console
- [ ] 19.8 Manual error XSS test: trigger server error, verify `showToast` renders message safely
- [ ] 19.9 Manual plugin test: install modified plugin script, verify hash mismatch warning appears
- [x] 19.10 Write unit tests for `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()`, `sanitizeText()`
- [ ] 19.11 Write unit test for token encryption round-trip
