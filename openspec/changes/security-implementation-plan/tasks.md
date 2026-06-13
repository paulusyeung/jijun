## Phase 1: Foundation — Sanitization + Automated Audit (Tasks 1-7)

### 1. Sanitization Utilities + Unit Tests

- [ ] 1.1 Add `escAttr(str)` function to `src/js/utils.js` (escapes & " ' < >)
- [ ] 1.2 Add `sanitizeHTML(str)` function to `src/js/utils.js` (strips event handlers, removes script/object/iframe/embed/link/style)
- [ ] 1.3 Add `sanitizeSVG(svgString)` function to `src/js/utils.js` (strips event handlers, javascript: URIs, script/object/iframe/embed elements)
- [ ] 1.4 Export all three functions from `src/js/utils.js`
- [ ] 1.5 Write unit tests for `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()` — cover known XSS payloads (`<img src=x onerror=...>`, `javascript:`, event handlers, attribute injection)

### 2. Fix XSS in debtManager.js

- [ ] 2.1 Fix contact name rendering at `debtManager.js:297` — wrap `contact.name` with `escAttr()`
- [ ] 2.2 Fix debt description rendering at `debtManager.js:315,325` — wrap `debt.description` with `escAttr()`
- [ ] 2.3 Fix attribute injection at `debtManager.js:692` — wrap with `escAttr()` in `value="..."` interpolation
- [ ] 2.4 Fix textarea content at `debtManager.js:808` — wrap `contactName` and `debt.description` with `escAttr()`

## 3. Fix XSS in recordsList.js

- [ ] 3.1 Fix category name at `recordsList.js:508` — wrap `category?.name` with `escAttr()`
- [ ] 3.2 Fix record description at `recordsList.js:513` — wrap `record.description` with `escAttr()`
- [ ] 3.3 Fix category filter modal at `recordsList.js:621,628` — wrap `category.name` with `escAttr()`
- [ ] 3.4 Fix account filter modal at `recordsList.js:667` — wrap `account.name` with `escAttr()`

## 4. Fix XSS in statistics.js

- [ ] 4.1 Fix record description interpolation at `statistics.js:263` — wrap `r.description` and `categoryName` with `escAttr()`

## 5. Fix XSS in Store and Theme Store pages

- [ ] 5.1 Fix plugin name/description/author at `storePage.js:79` — wrap `p.name`, `p.description`, `p.author` with `escAttr()`
- [ ] 5.2 Fix theme name/description at `themeStorePage.js:87-89` — wrap `t.name`, `t.description` with `escAttr()`

## 6. Fix Theme SVG Injection

- [ ] 6.1 Add SVG sanitization call before `template.innerHTML` assignment in `themeManager.js:144`
- [ ] 6.2 Apply `sanitizeSVG()` to `replacementInfo.svg` before DOM insertion

## 7. Automated XSS Sink Audit + Remaining Fixes

- [ ] 7.1 Create ESLint custom rule or AST walker script to scan all `innerHTML` assignments in `src/js/pages/*.js` for unescaped user data
- [ ] 7.2 Run the scanner, generate a checklist of sinks that need remediation
- [ ] 7.3 Apply `escAttr()` to any missed sinks identified by the automated audit
- [ ] 7.4 Add the ESLint rule to CI/lint pipeline as a regression gate

---

## Phase 2: Hardening — Plugin Sandbox + Sync Security (Tasks 8-11)

### 8. Plugin Sandbox Hardening (Feature-Flagged)

- [ ] 8.1 Add feature flag `settings.pluginSandboxV2` to IndexedDB settings store (default: `false`)
- [ ] 8.2 Refactor `pluginManager.js:loadPlugin()` to create a sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`) when flag is enabled
- [ ] 8.3 Refactor `pluginManager.js:createPluginContext()` to use `postMessage` for parent-plugin communication with unique channel UUID per plugin instance
- [ ] 8.4 Add `postMessage` event listener in plugin context handler with channel ID validation (not origin-based, since iframe is `about:blank`)
- [ ] 8.5 Update `PluginStorage` to proxy reads/writes through the parent frame via `postMessage`
- [ ] 8.6 Add migration shim for legacy plugins (auto-wraps old context API for 6 months; logs deprecation warning)
- [ ] 8.7 Add fallback logic: if iframe creation fails or flag is disabled, revert to legacy Proxy sandbox
- [ ] 8.8 Smoke test top 5 most-used plugins against new iframe sandbox

### 9. Sync Security — OAuth State

- [ ] 9.1 Generate and store `state` parameter in `syncService.js:_signInWeb()` using `crypto.randomUUID()`
- [ ] 9.2 Validate returned `state` in `syncService.js:handleAuthCallback()` before token exchange
- [ ] 9.3 Add `state` parameter to native sign-in path in `syncService.js:_signInNative()`

## 10. Sync Security — Token Encryption

- [ ] 10.1 Add `deriveDeviceKey()`, `encryptData()`, `decryptData()` functions to `src/js/utils.js` using Web Crypto API (PBKDF2 + AES-GCM)
- [ ] 10.2 Encrypt tokens before save in `syncService.js:saveTokens()`


- [ ] 10.3 Decrypt tokens on load in `syncService.js:init()` with lazy migration for existing plaintext tokens (try decrypt, fall back to parse JSON, re-encrypt)
- [ ] 10.4 Write unit test for token encryption round-trip


### 11. Sync Security — Optimistic Locking

- [ ] 11.1 Return ETag from `_findFile()` in `syncService.js:1141`
- [ ] 11.2 Return ETag from `_downloadFile()` in `syncService.js:1176`
- [ ] 11.3 Add `If-Match` header to `_updateFile()` in `syncService.js:1351`
- [ ] 11.4 Handle 412 PreconditionFailed in `pushSharedLedgerChanges()` — re-download, re-merge, retry

## 12. Server Security

- [ ] 12.1 Add rate limiting (10 req/60s per IP) to `server/src/index.js:handleTokenExchange()` and `handleTokenRefresh()`
- [ ] 12.2 Remove `details: data` from error responses in `server/src/index.js:93,134`
- [ ] 12.3 Change Docker CORS default from `*` to empty string in `docker-compose.yml:10`

## 13. CSP and Transport Security

- [ ] 13.1 Add `<meta http-equiv="Content-Security-Policy">` to `index.html` with restrictive `script-src`, `connect-src`, `frame-src`, `object-src`, `base-uri`
- [ ] 13.2 Generate SHA-384 hashes and add `integrity` attributes to all CDN `<script>` and `<link>` tags in `index.html`

## 14. ServiceWorker Security

- [ ] 14.1 Add origin validation in `public/serviceWorker.js:216` — reject messages where `event.origin !== self.location.origin`

## 15. Additional Hardening

- [ ] 15.1 Enforce plugin ID format in `pluginStorage.js:19` — throw error instead of console.warn
- [ ] 15.2 Move ad-free status tracking from `localStorage` to IndexedDB in `rewardService.js:197-203`
- [ ] 15.3 Fix manifest scope from `"../"` to `"/"` in `manifest.json:14`

## 16. Verification

- [ ] 16.1 Run `npm run lint` — confirm no new warnings
- [ ] 16.2 Run `npm test` — confirm all existing tests pass
- [ ] 16.3 Manual XSS test: create contact with `<img src=x onerror=alert(1)>`, verify no alert
- [ ] 16.4 Manual XSS test: apply malicious theme SVG, verify no script execution
- [ ] 16.5 Manual sync test: sign in with Google, verify tokens encrypted in IndexedDB
- [ ] 16.6 Manual sync test: two devices edit same shared ledger, verify no data loss
- [ ] 16.7 Verify CSP blocks external fetch via DevTools console
- [ ] 16.8 Write unit tests for `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()`
- [ ] 16.9 Write unit test for token encryption round-trip
