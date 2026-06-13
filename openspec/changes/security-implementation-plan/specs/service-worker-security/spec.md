## ADDED Requirements

### Requirement: ServiceWorker message origin validation

The ServiceWorker message event handler SHALL validate that `event.origin` matches `self.location.origin` before processing any `postMessage` data. If the origin does not match, the message SHALL be silently ignored.

#### Scenario: Message from untrusted origin ignored
- **WHEN** a postMessage is sent to the ServiceWorker from `https://evil.com`
- **THEN** the ServiceWorker SHALL NOT process the message
- **THEN** the ServiceWorker SHALL NOT schedule any notification or trigger any action

#### Scenario: Message from own origin processed
- **WHEN** a postMessage is sent to the ServiceWorker from the application's own origin
- **THEN** the ServiceWorker SHALL process the message as normal
