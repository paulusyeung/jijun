## Context

The application is a client-side PWA with an IndexedDB-backed data layer. It stores all user data locally, syncs via Google Drive (with a Cloudflare Worker OAuth proxy), supports third-party plugins, and serves ads via AdMob/AdSense. The security audit identified critical XSS, plugin sandbox escape vectors, and weak sync/transport security.

The existing codebase has:
- 104+ `innerHTML` assignments across page components — many interpolating user-controlled data
- A plugin sandbox built on `Proxy` + `Blob URL` that can be escaped via `constructor.constructor`
- OAuth tokens stored as plain JSON in IndexedDB
- No CSP headers or SRI on CDN resources
- A Cloudflare Worker with no rate limiting and verbose error responses
- ServiceWorker that accepts `postMessage` from any source

## Goals / Non-Goals

**Goals:**
- Eliminate all stored XSS vectors reachable through user-supplied data (contact names, descriptions, category names, plugin metadata)
- Prevent plugin sandbox escape — plugins SHALL NOT access parent DOM, IndexedDB, localStorage, or network unless explicitly granted
- Protect OAuth tokens at rest and in transit — tokens SHALL be encrypted before storage; OAuth flow SHALL include `state` parameter CSRF protection
- Add CSP to limit blast radius of any remaining XSS
- Add SRI hashes to all third-party scripts to prevent supply-chain compromise
- Harden sync server against abuse (rate limiting, no error leakage, strict CORS)
- Validate ServiceWorker message origins
- Enforce plugin ID format in storage layer

**Non-Goals:**
- Removing `unsafe-eval` or `unsafe-inline` from CSP (required by Chart.js and Tailwind JIT — upstream limitations)
- Full authentication/authorization system (beyond OAuth sync)
- Migrating away from IndexedDB or adding server-side data storage
- Rewriting the plugin system API surface (only the isolation mechanism changes)
- Encrypting all IndexedDB data at rest (only OAuth tokens)

## Decisions

### Decision 1: DOM-based sanitization over DOMPurify
**Choice:** Implement `escAttr()` using `textContent`-based HTML escaping and `sanitizeSVG()` via DOM traversal + attribute whitelist, rather than adding DOMPurify as a dependency.
**Rationale:** The app only needs simple escaping (no rich text). DOMPurify is 33KB gzipped and adds a CDN dependency. The DOM-based approach covers all vectors: attribute injection, event handler attributes, `javascript:` URIs, and `<script>/<object>/<iframe>` removal.
**Trade-off:** More code to maintain vs. a battle-tested library. If rich text rendering is ever needed, DOMPurify should be adopted then.

### Decision 2: iframe sandbox for plugin isolation
**Choice:** Replace the current Proxy + Blob URL sandbox with an `<iframe sandbox="allow-scripts">` (no `allow-same-origin`). Communication via `postMessage` with structured clone.
**Rationale:** The current Proxy approach is fundamentally insecure — the plugin code runs in the same realm as the app, and there are well-documented prototype-based escape techniques. An iframe with `sandbox="allow-scripts"` creates a separate JavaScript realm with no access to the parent origin's globals, DOM, or storage. This is the gold standard for in-browser isolation.
**Trade-off:** Breaking change for existing plugins (they must adapt to `postMessage`-based API). Mitigation: provide a shim that wraps the old context API for 6 months.

### Decision 3: Web Crypto PBKDF2 for token encryption
**Choice:** Derive an encryption key from `deviceId + salt` using PBKDF2, then encrypt OAuth tokens with AES-GCM.
**Rationale:** This provides protection against passive storage access (e.g., another XSS vulnerability reading IndexedDB). Since the key material is on-device, it's not true zero-knowledge, but it raises the bar significantly. AES-GCM provides authenticated encryption.
**Trade-off:** Key derivation adds ~100ms on init. Not cryptographically secret from a determined attacker with JS execution, but blocks casual data theft. A future improvement could use the WebAuthn API for stronger binding.

### Decision 4: ETag-based optimistic locking over CRDT
**Choice:** Use Google Drive's ETag/If-Match headers for conflict detection on shared ledger files, rather than implementing CRDT-based merge logic.
**Rationale:** The current "full comparison" strategy has a race condition where two devices can overwrite each other's changes. ETags provide simple, reliable conflict detection. On 412 Precondition Failed, the client re-downloads, re-merges, and retries. CRDTs would be more robust but far more complex and require schema changes.
**Trade-off:** Under high write contention, retries could cause temporary slowdowns. Acceptable given the single-user/small-team usage pattern.

### Decision 5: Automated XSS sink scanning over manual audit
**Choice:** Use a custom ESLint rule or AST walker to automatically identify all `innerHTML` assignments that interpolate user-controlled data, rather than relying on manual grep-based audit.
**Rationale:** Manually auditing 104+ sinks is extremely error-prone and likely to miss edge cases. An automated scanner produces a reproducible, version-controlled checklist that can be re-run after every code change.
**Trade-off:** Initial setup cost for the ESLint rule/AST walker. Payoff: eliminates human error in sink identification and creates a gate for future regressions.

### Decision 6: Feature-flagged plugin sandbox migration
**Choice:** Gate the new iframe-based plugin sandbox behind a feature flag (`settings.pluginSandboxV2 = true/false`) with automatic fallback to the legacy Proxy sandbox if iframe creation fails or if the flag is disabled.
**Rationale:** The plugin refactor is the highest-risk change in this proposal. A feature flag enables gradual rollout, A/B testing, and instant rollback without deploying a new version.
**Trade-off:** Additional complexity in `pluginManager.js` to support both sandbox modes simultaneously during the transition period (6 months).

### Decision 7: Device-bound key derivation using Web Crypto's subtle.deriveBits
**Choice:** Derive the AES-GCM encryption key from a combination of the device ID (stored in IndexedDB under a fixed key) and a random salt (generated on first run, stored alongside encrypted tokens). Use `crypto.subtle.importKey` + `crypto.subtle.deriveBits` with PBKDF2.
**Rationale:** The device ID itself is not secret (it's in IndexedDB), but combining it with a random salt and deriving through PBKDF2 means an attacker who reads the database still needs to perform key derivation — which raises the bar against passive data theft. The salt ensures identical device IDs produce different keys.
**Trade-off:** If the device ID is compromised (e.g., via XSS), the encryption provides limited additional protection. This is defense-in-depth, not a substitute for eliminating XSS. Future improvement: bind to WebAuthn credential for true hardware-backed key storage.

## Risks / Trade-offs

- **[High] Plugin breakage from iframe refactor**: Existing plugins written against the current `context.data`, `context.ui`, `context.storage` API will need updates to work with `postMessage`. **Mitigation**: Release a migration shim that auto-wraps old-style plugins for 6 months. Feature flag enables instant rollback if issues arise.
- **[High] Incomplete XSS sink audit**: If any of the 104+ `innerHTML` sinks is missed, stored XSS remains exploitable. **Mitigation**: Use automated ESLint-based scanning (Decision 5) to produce a reproducible checklist. Run the scan as part of CI/lint pipeline to catch regressions.
- **[Medium] CSP `unsafe-eval` required**: Chart.js uses `new Function()` internally. Without it, charts break. **Mitigation**: Monitor chart.js issue #10694 for a fix; accept as known limitation.
- **[Medium] Token encryption not true zero-knowledge**: Derived key is device-local. A sandbox-escape-level XSS could still exfiltrate the key. **Mitigation**: Combine with CSP to make XSS exploitation harder. Consider WebAuthn binding in future.
- **[Low] ETag conflicts under concurrent edits**: Two users editing the same shared ledger simultaneously will cause one to get a 412 and retry. Acceptable for the target use case (1-5 users per ledger).
- **[Low] postMessage origin validation complexity**: iframe sandbox messages originate from `null`/`about:blank`, requiring careful source identification. **Mitigation**: Use a unique channel identifier (random UUID per plugin instance) to validate message sources rather than relying on `event.origin`.

## Rollback Plan

| Component | Rollback Strategy | Trigger Condition |
|-----------|-------------------|-------------------|
| Plugin sandbox | Toggle `settings.pluginSandboxV2 = false` in IndexedDB; reverts to Proxy sandbox | >10% plugin crash rate or user-reported breakage |
| Token encryption | Detect plaintext tokens on load (try decrypt, fall back to parse JSON); migrate lazily | Decryption failures across multiple devices |
| CSP policy | Remove `<meta http-equiv="Content-Security-Policy">` tag via feature flag in build config | Legitimate scripts blocked by overly restrictive policy |
| ETag locking | Disable `If-Match` header; revert to full-comparison merge | Persistent 412 loops under normal usage |

## Testing Strategy

- **Unit tests** for `escAttr()`, `sanitizeHTML()`, `sanitizeSVG()` — written alongside implementation (Phase 1), not deferred
- **Automated XSS regression tests** — inject known payloads into each user-data field and assert no script execution
- **Integration tests** for OAuth flow with state validation, token encryption round-trip, and ETag conflict handling
- **Manual smoke tests** for plugin compatibility (top 5 most-used plugins tested against new iframe sandbox)
