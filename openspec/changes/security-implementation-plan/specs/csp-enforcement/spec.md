## ADDED Requirements

### Requirement: Content Security Policy meta tag

The system SHALL include a `<meta http-equiv="Content-Security-Policy">` tag in `index.html` that restricts resource loading. The policy SHALL at minimum:
- Restrict `script-src` to `'self'` plus the known CDN origins (cdn.tailwindcss.com, cdnjs.cloudflare.com, cdn.jsdelivr.net, accounts.google.com, apis.google.com, pagead2.googlesyndication.com, securepubads.g.doubleclick.net, unpkg.com)
- Restrict `connect-src` to `'self'` plus `https://www.googleapis.com`, `https://oauth2.googleapis.com`, and the sync server origin
- Restrict `frame-src` to `https://accounts.google.com`, `https://docs.google.com`
- Set `object-src` to `'none'`
- Set `base-uri` to `'self'`

#### Scenario: Inline script blocked
- **WHEN** a `<script>` tag with inline code is injected into the DOM via an XSS vulnerability
- **THEN** the browser SHALL refuse to execute the script (CSP violation)

#### Scenario: External script from unknown origin blocked
- **WHEN** an injected script tag attempts to load from `https://evil.com/payload.js`
- **THEN** the browser SHALL refuse to load the script

### Requirement: Subresource Integrity on CDN resources

All `<script>` and `<link>` tags loading from CDNs in `index.html` SHALL include an `integrity` attribute with a valid `sha384-` hash of the resource content.

#### Scenario: CDN resource integrity checked
- **WHEN** a CDN-hosted script is loaded
- **THEN** the browser SHALL verify the `integrity` hash before executing the script
- **THEN** if the hash does not match, the script SHALL be blocked
