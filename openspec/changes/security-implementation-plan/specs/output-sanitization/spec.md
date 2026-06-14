## ADDED Requirements

### Requirement: escAttr() function

The system SHALL provide an `escAttr(str)` function that escapes HTML-special characters in attribute values. The function SHALL convert `&` → `&amp;`, `"` → `&quot;`, `'` → `&#39;`, `<` → `&lt;`, `>` → `&gt;`.

#### Scenario: Escapes all special characters
- **WHEN** `escAttr('<script>alert("xss")</script>')` is called
- **THEN** the result SHALL be `&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;`

### Requirement: sanitizeHTML() function

The system SHALL provide a `sanitizeHTML(str)` function that strips all HTML event handler attributes (onerror, onclick, onload, etc.) and removes `<script>`, `<object>`, `<embed>`, `<iframe>`, `<link>` and `<style>` elements from the input string.

#### Scenario: Removes event handlers
- **WHEN** `sanitizeHTML('<img src=x onerror=alert(1)>')` is called
- **THEN** the result SHALL be `<img src=x>`

#### Scenario: Removes script tags
- **WHEN** `sanitizeHTML('<script>alert(1)</script>hello')` is called
- **THEN** the result SHALL be `hello`

### Requirement: sanitizeSVG() function

The system SHALL provide a `sanitizeSVG(svgString)` function that accepts SVG markup and returns a safe version. It SHALL remove all event handler attributes, `javascript:` URIs in `href`/`xlink:href`, and `<script>`, `<object>`, `<embed>`, `<iframe>` child elements.

#### Scenario: Removes onload from SVG
- **WHEN** `sanitizeSVG('<svg onload="alert(1)"><circle/></svg>')` is called
- **THEN** the result SHALL be `<svg><circle/></svg>`

#### Scenario: Removes javascript: href
- **WHEN** `sanitizeSVG('<svg><a href="javascript:alert(1)">click</a></svg>')` is called
- **THEN** the result SHALL NOT contain `javascript:`

### Requirement: All user-data innerHTML sinks use escAttr()

Every `innerHTML` assignment in the codebase that interpolates user-controlled data (contact names, record descriptions, category names, debt descriptions, plugin metadata, shared user emails) SHALL wrap the data variable with `escAttr()` before string interpolation.

#### Scenario: Contact name is escaped in debt list
- **WHEN** a contact named `<img src=x onerror=alert(1)>` is created
- **THEN** the debt list page SHALL display the literal name text, SHALL NOT execute JavaScript

#### Scenario: Record description is escaped in records list
- **WHEN** a record with description `<script>alert(1)</script>` is created
- **THEN** the records list page SHALL display the literal description text, SHALL NOT execute JavaScript

### Requirement: SVG theme content is sanitized before DOM insertion

The system SHALL sanitize SVG content fetched from installed themes via `sanitizeSVG()` before inserting it into the DOM via `innerHTML` or `template.innerHTML` in `themeManager.js`.

#### Scenario: Malicious theme SVG is neutralized
- **WHEN** a theme with SVG containing `<svg onload="alert(1)">` is applied
- **THEN** the `onload` attribute SHALL be stripped and no alert SHALL fire

### Requirement: Plain-text UI helpers escape exactly once

The system SHALL treat `showToast()` as a plain-text rendering boundary. Callers SHALL pass raw strings, and the helper SHALL render them using `textContent` so user-controlled content is escaped exactly once.

#### Scenario: Raw error string renders safely in toast
- **WHEN** a sync or server error message contains `<img src=x onerror=alert(1)>`
- **THEN** the toast SHALL display the literal text
- **THEN** no JavaScript SHALL execute
- **THEN** the UI SHALL NOT show double-escaped entities caused by pre-sanitizing the message before calling `showToast()`

### Requirement: Imported data is sanitized at render sinks, not during import

The system SHALL preserve imported record fields, contact names, category names, and descriptions as raw data in storage. Any rendering path that uses `innerHTML` or attribute interpolation SHALL apply `escAttr()` or another context-appropriate sanitizer at the sink rather than mutating imported values during import.

#### Scenario: Imported payload stays raw but renders safely
- **WHEN** an imported record contains description `<script>alert(1)</script>`
- **THEN** the stored record SHALL preserve the original string value
- **THEN** any list, modal, or statistics view that renders the description through `innerHTML` SHALL escape it before insertion
- **THEN** no JavaScript SHALL execute
