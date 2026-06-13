## ADDED Requirements

### Requirement: OAuth state parameter validation

The sync service SHALL generate a cryptographically random `state` value before initiating the OAuth flow, store it in `sessionStorage`, and validate it against the value returned by Google's callback before exchanging the authorization code for tokens. If the state does not match, the token exchange SHALL be aborted.

#### Scenario: State mismatch aborts token exchange
- **WHEN** the OAuth callback returns a `state` value that does not match the stored value
- **THEN** the system SHALL reject the callback with an error message
- **THEN** the system SHALL NOT send the authorization code to the sync server

#### Scenario: Successful state validation proceeds
- **WHEN** the OAuth callback returns a `state` value that matches the stored value
- **THEN** the system SHALL proceed with the authorization code exchange

### Requirement: OAuth tokens encrypted at rest

The system SHALL encrypt the OAuth access token, refresh token, and user info before storing them in IndexedDB. Encryption SHALL use AES-GCM with a key derived from the device ID via PBKDF2 (100,000 iterations). The decrypted tokens SHALL only be held in memory.

#### Scenario: Tokens stored encrypted
- **WHEN** tokens are saved via `saveTokens()`
- **THEN** the `sync_tokens` setting in IndexedDB SHALL contain an encrypted blob, SHALL NOT contain the raw access_token or refresh_token

#### Scenario: Tokens decrypted on load
- **WHEN** `syncService.init()` loads saved tokens
- **THEN** the encrypted blob SHALL be decrypted and the access token SHALL be available in memory

### Requirement: Shared ledger optimistic locking

When updating a shared ledger file on Google Drive, the system SHALL include the `If-Match` header with the ETag value obtained from the previous file download. If the server responds with HTTP 412 (Precondition Failed), the system SHALL re-download the file, re-compute the merge, and retry the update.

#### Scenario: Conflict detected and retried
- **WHEN** a shared ledger push receives HTTP 412 Precondition Failed
- **THEN** the system SHALL re-download the latest file from Google Drive
- **THEN** the system SHALL re-merge local changes with the fresh remote data
- **THEN** the system SHALL retry the upload with the updated ETag
