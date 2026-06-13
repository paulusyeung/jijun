## Context

The app is a vanilla JS PWA with 35+ source files rendering UI exclusively via `innerHTML` template literals. Every page file, utility module, and the main HTML file contains hardcoded Traditional Chinese strings. There is no i18n library, no locale detection, no translation files, and no language selector. Date/number formatting via `Intl` is hardcoded to `'zh-TW'`. Category names are defined as JS objects in `categories.js` with Chinese display names.

**~2,000 unique translatable strings** exist across the codebase, organized across page templates (~1,400 strings), utility modules (~300 strings), category names (16 names), and infrastructure (~150 strings). This is significantly higher than the initial estimate of 700-900.

## Goals / Non-Goals

**Goals (Phase 1 - v1):**
- Support **two languages**: English (base/fallback) and Traditional Chinese
- Auto-detect user's browser language on first visit
- Allow manual language override via a Settings page dropdown
- Persist language preference to `localStorage`
- Refactor every hardcoded Chinese string to a `t()` call with JSON-backed translations
- Make all `Intl.NumberFormat`/`Intl.DateTimeFormat` calls use the selected locale dynamically
- **Full page reload** on language switch (simpler, safer for v1)
- Keep changelog and privacy policy as single-language prose (Chinese only, English when translated)
- **Build-time validation**: Script to verify all `t()` keys exist in translation JSON files

**Goals (Phase 2 - v2):**
- Add Simplified Chinese (`zh-CN`) support
- Replace full page reload with client-side re-render for smoother UX
- Expand validation to catch missing interpolations and plural forms

**Non-Goals:**
- Auto-translating user-generated data (record descriptions, contact names, etc.)
- Pluralization rules (English and Chinese handle plurals identically in this app's context)
- RTL language support
- Full community translation platform (future consideration)
- Translating the changelog history retroactively (only forward-looking)

## Decisions

### Decision 1: i18next over custom implementation
**Choice:** Use `i18next` (16KB gzip with detector) rather than a custom `t()` function.
**Rationale:** ~2,000 strings justify a production-grade library. i18next provides built-in language detection, fallback chains, nested keys, interpolation, and namespace splitting. A custom implementation would replicate all of this with more bugs and less testing.
**Trade-off:** 16KB additional payload. Acceptable for a productivity app.

### Decision 2: Namespace-per-page structure
**Choice:** Organize translation files by namespace matching page/domain names (common, home, add, settings, records, stats, ledger, accounts, debts, recurring, amortizations, plugins, sync, categories, errors).
**Rationale:** Avoids a single 2,000-key JSON file which is unmaintainable. Namespacing allows lazy-loading (future) and keeps each file focused. The `common` namespace covers shared strings (nav, buttons, toasts, modals).
**Trade-off:** More files to manage (15 per language × 2 languages = 30 files for v1, 45 for v2). But each file is small and focused.

### Decision 3: Category names as translatable keys
**Choice:** Add a `nameKey` property to each category definition in `categories.js`, and add a helper `getCategoryName(cat)` that calls `t(cat.nameKey)`. Keep the existing `name` property unchanged for backward compatibility.
**Rationale:** Categories are consumed in dozens of locations (`recordsList.js`, `statistics.js`, `debtManager.js`, `budgetManager.js`, all page templates). A centralized getter avoids touching every call site.
**Trade-off:** Slight indirection. But adding `nameKey` alongside `name` is non-breaking and allows incremental migration.

### Decision 4: Changelog and Privacy as separate non-namespace content
**Choice:** Keep changelog entries in their original Chinese. For the privacy page, load locale-specific Markdown/HTML files from `public/locales/<lang>/privacy.html` via `fetch()` on render.
**Rationale:** Changelog is 966 lines of Chinese prose — impractical to retro-translate. Privacy page is legal text best handled with full-page translations per locale.
**Trade-off:** Privacy page requires a `fetch` per language switch. Acceptable — it's a rarely-visited page.

### Decision 5: `public/locales/` for static JSON delivery
**Choice:** Place translation files under `public/locales/` so Vite copies them verbatim to `dist/locales/` without hash-fingerprinting. Load via `fetch` at runtime using i18next's default backend.
**Rationale:** Translation files are content, not code. They must be loadable at runtime without being bundled. `public/` is the standard Vite convention for static assets.
**Trade-off:** Translation files are not hashed for cache-busting. Mitigation: app version added to URL path.

### Decision 6: Full page reload for language switch (v1)
**Choice:** Trigger a full page reload (`location.reload()`) when the user changes language in v1, instead of complex client-side re-rendering.
**Rationale:** 
- Simpler implementation: no need to track state across re-renders
- Avoids bugs with open modals, form data loss, or incomplete re-renders
- Easier to debug and maintain
- Can be upgraded to client-side re-render in v2 once the i18n foundation is stable
**Trade-off:** Brief page flash on language switch. Acceptable for v1 given the complexity of the current architecture.

### Decision 7: Build-time translation validation
**Choice:** Add a Node.js script (`scripts/validate-translations.js`) that:
1. Grep all `t('namespace:key')` calls in source files
2. Cross-reference against keys in `public/locales/en/*.json` and `public/locales/zh-TW/*.json`
3. Fail the build if any key is missing
**Rationale:** Prevents shipping with missing translations, which would show raw keys to users.
**Trade-off:** Adds a step to the build process. Can be integrated into `npm run build` or CI pipeline.

## Risks / Trade-offs

- **[Low] Missing keys in en**: Traditional Chinese is fully translated (it's the app's source language). English will have gaps initially during development. **Mitigation:** i18next fallback chain (`en` → `zh-TW` → key name) ensures no blank UI — missing keys fall through gracefully. Build-time validation catches this before shipping.
- **[Low] Page reload on language switch (v1)**: Full page reload is simpler but causes a brief flash. **Mitigation:** This is acceptable for v1. Can be upgraded to client-side re-render in v2 if user feedback demands it.
- **[Low] Performance**: Loading 15 small JSON files per language on init. Mitigation: i18next loads them in parallel. With HTTP/2 multiplexing, this is negligible.
- **[Medium] Scope underestimation**: Initial estimate was 700-900 strings; actual count is ~2,000. **Mitigation:** Phased rollout (en + zh-TW first) reduces initial translation burden by 50%. zh-CN deferred to v2.