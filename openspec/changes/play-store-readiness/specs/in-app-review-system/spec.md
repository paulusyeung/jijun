## ADDED Requirements

### Requirement: Usage-based review prompt

The app SHALL prompt the user to rate the app on Google Play after they have created at least 30 records AND the app has been installed for at least 7 days. The prompt SHALL use `capacitor-rate-app`'s `requestReview()` on native Android (if compatible with Capacitor 8), otherwise a custom Play Review API wrapper. On web, it SHALL be a no-op.

#### Scenario: Review prompt triggered
- **GIVEN** the user has been using the app for 8 days
- **AND** they have created 35 records
- **WHEN** the app initializes (or enters foreground)
- **THEN** `RateApp.requestReview()` SHALL be called with a best-effort prompt (or custom wrapper equivalent)

#### Scenario: Review prompt only fires once per major version
- **GIVEN** the user has already been prompted for a review on current major version
- **WHEN** they create additional records beyond 30
- **THEN** no review prompt SHALL be shown again

#### Scenario: Review prompt re-fires on major version update
- **GIVEN** the user was prompted on v2.1.x
- **AND** app is updated to v2.2.0
- **WHEN** they meet usage criteria again
- **THEN** review prompt SHALL be shown again (tracked via `lastPromptedVersion`)

#### Scenario: Review prompt not triggered on web
- **GIVEN** the user is on a web browser
- **AND** they have 35 records
- **AND** the app has been used for 8 days
- **WHEN** the app initializes
- **THEN** no review SHALL be requested (no-op)

### Requirement: Review attempt tracking

The system SHALL track review prompt state in IndexedDB: `lastReviewPromptDate`, `recordCountAtLastPrompt`, and `lastPromptedVersion`. These SHALL be used to enforce the once-per-major-version and minimum-usage thresholds.

#### Scenario: Tracking prevents repeated prompts
- **GIVEN** `lastReviewPromptDate` is set to a past date
- **WHEN** the app checks review eligibility
- **THEN** the system SHALL NOT prompt again regardless of record count

#### Scenario: Version tracking enables re-prompt
- **GIVEN** `lastPromptedVersion` is "2.1.5"
- **AND** current app version is "2.2.0"
- **WHEN** the app checks review eligibility
- **THEN** the system SHALL allow prompt (major version changed)
