## ADDED Requirements

### Requirement: Rate limiting on token endpoints

The sync server SHALL limit requests to `/api/auth/token` and `/api/auth/refresh` to a maximum of 10 requests per 60 seconds per IP address. Requests exceeding this limit SHALL receive HTTP 429 (Too Many Requests).

#### Scenario: Rate limit exceeded
- **WHEN** a client sends more than 10 requests to `/api/auth/token` within 60 seconds
- **THEN** the server SHALL respond with HTTP 429 and a JSON body containing `{ "error": "Too many requests" }`

### Requirement: Error responses must not leak details

The sync server's token exchange and refresh handlers SHALL NOT include the `details` field (containing Google's raw error response) in their error responses. Error responses SHALL only contain the `error` field with a generic message.

#### Scenario: Error response sanitization
- **WHEN** token exchange fails with an invalid authorization code
- **THEN** the response body SHALL be `{ "error": "Token exchange failed" }` and SHALL NOT contain `{ "details": ... }`

### Requirement: CORS restricted to configured origins

The standalone server (Docker) SHALL default to an empty ALLOWED_ORIGINS rather than `*`. Operators SHALL explicitly configure the allowed origins via the `ALLOWED_ORIGINS` environment variable. The Cloudflare Worker SHALL continue to use its configured `ALLOWED_ORIGINS` variable.

#### Scenario: Default CORS wildcard removed
- **WHEN** the standalone server starts with no `ALLOWED_ORIGINS` environment variable
- **THEN** the server SHALL NOT add `Access-Control-Allow-Origin: *` headers
