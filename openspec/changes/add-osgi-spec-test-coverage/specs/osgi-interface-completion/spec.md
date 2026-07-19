# OSGi Interface Completion Specification

## Purpose

Formalize the OSGi-conformant behavior of the ported interfaces that this change
completes, so each requirement is independently verifiable. Scope is limited to
surface Pandino actually implements; features explicitly out of scope (R8 Logger
`{}` formatting, per-level `isXEnabled()`) are not specified here.

## Requirements

### Requirement: Log severity includes AUDIT and TRACE

The `LogService` SHALL expose the OSGi severity levels `AUDIT` and `TRACE` in
addition to `ERROR`, `WARN`, `INFO`, and `DEBUG`, with `AUDIT` the most severe
and `TRACE` the least severe. Existing numeric values for `ERROR`/`WARN`/`INFO`/
`DEBUG` SHALL remain unchanged.

#### Scenario: AUDIT is always recorded

- WHEN the configured level is `ERROR` and `audit(message)` is called
- THEN the entry SHALL be recorded regardless of the threshold
- AND `isLoggable(AUDIT)` SHALL return `true`

#### Scenario: TRACE respects the threshold

- WHEN the configured level is `INFO` and `trace(message)` is called
- THEN the entry SHALL NOT be recorded
- WHEN the configured level is raised to `TRACE`
- THEN a subsequent `trace(message)` SHALL be recorded at level `TRACE`

#### Scenario: Level ordering

- WHEN comparing level values
- THEN `AUDIT` SHALL be less than `ERROR` and `TRACE` SHALL be greater than `DEBUG`

### Requirement: LDAP approximate match operator

The LDAP filter SHALL support the approximate-match operator `~=`, comparing
values case-insensitively after removing whitespace. It SHALL compose with the
`&`, `|`, and `!` operators.

#### Scenario: Case- and whitespace-insensitive match

- WHEN the filter is `(name~=John Smith)` and the property is `johnsmith`
- THEN the filter SHALL match
- WHEN the property is `Smyth` for filter `(name~=Smith)`
- THEN the filter SHALL NOT match

#### Scenario: Missing property

- WHEN the filter is `(name~=Smith)` and the property is absent
- THEN the filter SHALL NOT match

### Requirement: Bundle update

`Bundle.update(module?)` SHALL replace bundle content and fire an `UPDATED`
bundle event on success. A bundle that was `ACTIVE` SHALL be stopped before the
swap and restarted after it; a non-active bundle SHALL end in `RESOLVED`. An
`UNINSTALLED` bundle SHALL NOT be updatable. Resolving the new module SHALL occur
before stopping, so a failed module load does not tear down a running bundle.

#### Scenario: Update with new module while active

- WHEN an `ACTIVE` bundle is updated with a new module
- THEN the old activator SHALL be stopped and the new activator started
- AND the bundle SHALL end `ACTIVE` with the new headers/version
- AND an `UPDATED` event SHALL be fired

#### Scenario: Update of a non-active bundle

- WHEN a `RESOLVED`/`INSTALLED` bundle is updated
- THEN it SHALL end in `RESOLVED` and SHALL NOT be started

#### Scenario: Failed module load does not stop a running bundle

- WHEN an `ACTIVE` bundle is updated with a module promise that rejects
- THEN `update` SHALL reject
- AND the bundle SHALL remain `ACTIVE` at its previous version
- AND the previous activator SHALL NOT have been stopped

#### Scenario: Update after uninstall

- WHEN `update` is called on an `UNINSTALLED` bundle
- THEN it SHALL throw

### Requirement: ServiceTracker completeness

`ServiceTracker` SHALL provide `waitForService`, `remove`, `getTrackingCount`,
`getTracked`, `isEmpty`, and a singular `getServiceReference()`.

#### Scenario: Tracking count lifecycle

- WHEN the tracker is closed
- THEN `getTrackingCount()` SHALL return `-1`
- WHEN opened with no matching services
- THEN `getTrackingCount()` SHALL return `0`
- WHEN a service is added, then removed
- THEN the tracking count SHALL increment on each transition

#### Scenario: Best-reference selection

- WHEN multiple services are tracked
- THEN `getServiceReference()` SHALL return the highest-ranked reference
- WHEN nothing is tracked
- THEN it SHALL return `null`

#### Scenario: waitForService resolution

- WHEN `waitForService(0)` is called and a service is already tracked
- THEN it SHALL resolve immediately with that service
- WHEN no service is tracked and one arrives afterward
- THEN the pending call SHALL resolve with the arriving service
- WHEN a positive timeout elapses with no service
- THEN it SHALL resolve with `null`
- WHEN the timeout is negative
- THEN it SHALL throw

### Requirement: ServiceTracker reference release is exception-safe

The tracker SHALL release (`ungetService`) an obtained reference even when a
customizer callback throws.

#### Scenario: addingService throws

- WHEN a customizer `addingService` throws during tracking
- THEN the obtained reference SHALL be ungotten
- AND the error SHALL propagate

#### Scenario: removedService throws

- WHEN a customizer `removedService` throws during untracking
- THEN the reference SHALL still be ungotten
- AND the error SHALL propagate
