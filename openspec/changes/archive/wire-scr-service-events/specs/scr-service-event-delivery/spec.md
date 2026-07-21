# SCR Service-Event Delivery Specification

## Purpose

Make the SCR react to runtime service-registry events (register / modify /
unregister) so its already-implemented reference state machine actually runs in
a live framework, delivered through a re-entrancy-safe serialized queue.

## Requirements

### Requirement: The SCR subscribes to service events

The SCR runtime SHALL register a `ServiceListener` while active and remove it on
stop. Each `ServiceEvent` SHALL be translated to the SCR's internal event form
(`registered` / `modified` / `unregistered`) and dispatched for every interface
in the service's `objectClass`.

#### Scenario: Listener lifecycle

- WHEN the SCR bundle starts
- THEN a `ServiceListener` SHALL be added to its bundle context
- WHEN the SCR bundle stops
- THEN that listener SHALL be removed and no further events processed

### Requirement: Serialized, re-entrancy-safe delivery

Service events SHALL be processed one at a time by a single async consumer. An
event emitted as a side effect of processing another event (e.g. a component
(de)activation registering its own service) SHALL be enqueued and processed
after the current one — never processed re-entrantly, and never dropped.

#### Scenario: A reaction that emits does not re-enter

- WHEN handling a service event causes the SCR to register/unregister a service
- THEN the resulting event SHALL be enqueued and handled after the current event completes
- AND the in-progress activation SHALL complete without corruption

#### Scenario: FIFO ordering

- WHEN multiple service events are emitted in sequence
- THEN the SCR SHALL process them in the order received

#### Scenario: Handler error isolation

- WHEN processing one event throws
- THEN the error SHALL be logged and the queue SHALL continue with the next event

### Requirement: No double activation or double binding

Runtime service events SHALL NOT re-activate an already-active component nor
bind a service already bound at activation.

#### Scenario: Overlapping triggers bind once

- WHEN a component is activated via a bundle event and its dependency service also raises a service event
- THEN the dependency SHALL be bound exactly once

### Requirement: Runtime dynamic reference behavior

With events wired, the reference state machine SHALL be observable at runtime:

#### Scenario: Late dynamic bind

- WHEN a service matching an active component's dynamic reference registers after activation
- THEN the component SHALL bind it

#### Scenario: Greedy static reactivation (SP-GRD-01, live)

- WHEN a higher-ranked service registers for an active static/greedy reference
- THEN the component SHALL reactivate onto the higher-ranked service

#### Scenario: Mandatory loss (SP-GRD-02, live)

- WHEN the bound service of a mandatory reference unregisters with no replacement
- THEN the component SHALL deactivate

### Requirement: Mandatory reference rebinds onto a survivor (#4)

When a mandatory reference's bound service unregisters while another usable
service remains, the component SHALL switch to the survivor: a static reference
by full reactivation, a dynamic 1..1 reference by rebinding in place. This
applies only when the departing service reference is known.

#### Scenario: Static survivor

- WHEN a bound static 1..1 reference's service departs and a survivor exists
- THEN the component SHALL reactivate bound to the survivor

#### Scenario: Dynamic survivor

- WHEN a bound dynamic 1..1 reference's service departs and a survivor exists
- THEN the component SHALL unbind the departed service and bind the survivor without deactivating

#### Scenario: Direct caller without a departing reference is unaffected

- WHEN `processServiceEvent('unregistered')` is invoked without a concrete `serviceRef`
- THEN the survivor-rebind branch SHALL NOT run (preserving existing direct-call behavior)
