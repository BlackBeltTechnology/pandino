# **A Formal Lifecycle Model for Declarative Service Components**

## **The Foundational Model: The Dual State Machine of Declarative Components**

A precise and testable understanding of the Declarative Services (DS) component lifecycle requires moving beyond a monolithic view of component states. The behavior specified in the OSGi service component specification is best modeled not as a single state machine, but as two distinct, interconnected state machines: one for the Component _Configuration_ and another for the Component _Instance_.1 This conceptual separation is fundamental to correctly implementing and verifying the behavior of all component types, particularly those designed for delayed activation to optimize system performance. The Component Configuration represents the
_potential_ for a component to be activated, governed by its dependencies, while the Component Instance represents the actual runtime object.

### **Defining the Component Configuration State Machine**

The Component Configuration state machine is an abstract representation managed by the Service Component Runtime (SCR), or an equivalent framework controller. Its state is determined exclusively by whether the component's declared dependencies are satisfied. This machine encapsulates the reactive nature of Declarative Services, where the runtime performs the complex work of tracking service dependencies and configurations, thus simplifying the component authoring process.1

- State: UNSATISFIED
  This is the initial and default state for any component configuration. A configuration resides in this state if it is explicitly disabled or if one or more of its mandatory dependencies are not met. These dependencies can be either service references with a required cardinality (e.g., $1..1$ or $1..n$) or a required configuration from a configuration service (when configurationPolicy="require").1 A component configuration in the
  UNSATISFIED state cannot produce a component instance and is, for all practical purposes, inert.
- State: SATISFIED
  A component configuration transitions to the SATISFIED state when it is enabled and all of its mandatory dependencies are fulfilled. This means that for every required service reference, at least one matching service is available in the service registry, and if a specific configuration is required, a corresponding configuration object is available from the configuration service.1 Reaching this state is the prerequisite for any subsequent activation of a component instance. The transition from
  UNSATISFIED to SATISFIED is a pivotal event, triggered by external changes in the runtime environment, such as the registration of a required service or the creation of a required configuration object.

### **Defining the Component Instance State Machine**

The Component Instance state machine represents the lifecycle of the actual object instantiated from the component's implementation class. This is the state machine that developers most directly interact with through lifecycle callback methods like @Activate and @Deactivate.

- State: INACTIVE
  In this state, no runtime instance of the component's implementation class exists. The module containing the class may not even be loaded into the runtime. This is the default state for the instance. For a component to have an instance, its corresponding configuration must first be SATISFIED.
- State: ACTIVE
  A component instance transitions to the ACTIVE state after it has been successfully created and initialized. This process, managed by the runtime, involves several distinct steps: instantiation of the implementation class, injection of all required dependencies (service references and configuration properties), and the successful invocation of the method annotated with a lifecycle decorator like @Activate. Once in the ACTIVE state, the component is fully functional and, if it provides a service, is ready to handle requests.

### **Linking the State Machines: The Role of the immediate Attribute**

The critical link between these two state machines—and the key to understanding the difference between immediate and delayed components—is the immediate attribute of the @Component annotation (or its equivalent in metadata).1 This attribute dictates the coupling between the configuration becoming
SATISFIED and the instance becoming ACTIVE.

- immediate=true (Tightly Coupled)
  When a component is declared as immediate, the two state machines are effectively synchronized. The moment the Component Configuration transitions from UNSATISFIED to SATISFIED, the runtime immediately initiates the process to transition the Component Instance from INACTIVE to ACTIVE. The satisfaction of dependencies is a direct and immediate trigger for the creation and activation of the runtime object.
- immediate=false (Decoupled / Delayed Component)
  For a delayed component, the state machines are decoupled. The Component Configuration can transition to SATISFIED and remain in that state indefinitely, while the Component Instance remains INACTIVE. The trigger for the instance's activation is deferred until an external event occurs, most commonly a request for the service provided by the component.1 When a delayed component's configuration becomes
  SATISFIED, the runtime registers its service in the service registry but does not create an instance. Only when another module requests that service does the runtime intercept the request and execute the INACTIVE to ACTIVE transition for the instance.

This decoupling is the primary mechanism by which Declarative Services addresses the critical system-level concerns of startup time and memory footprint outlined in the specification.1 By avoiding the instantiation of objects and even the loading of their code until they are explicitly needed, the framework minimizes the upfront resource cost of a large number of components.
The distinction between a SATISFIED configuration and an ACTIVE instance is the most crucial aspect for creating a compliant and robust test suite. A common state for a delayed component is to have a SATISFIED configuration but an INACTIVE instance. In this state, its service is discoverable in the service registry, yet no instance of its implementation class exists. A comprehensive test suite must be able to verify this intermediate state. The necessary test logic would proceed as follows: first, establish an environment where all dependencies for a delayed component are met. Second, query the service registry to confirm that a service reference for the component's service has been registered. Third, using a mechanism like runtime introspection or checking the state of the module loader, verify that the component's implementation code has not yet been loaded. Finally, programmatically request the service, which should trigger the activation, and then verify that an instance has been created and the @Activate method has been called. This level of verification ensures that the lazy-loading behavior, a cornerstone of DS performance optimization, is correctly implemented.

## **The Path to Satisfaction: Preconditions for Activation**

The transition of a Component Configuration from the UNSATISFIED state to the SATISFIED state is not a single event but the result of a sequential evaluation of several preconditions. The Service Component Runtime (SCR) follows a strict hierarchy when determining if a component can be satisfied. This hierarchical model is essential for understanding the component lifecycle and for designing a logical and effective test strategy. A failure to meet a condition at a higher level of the hierarchy prevents the evaluation of subsequent conditions.

### **Prerequisite 1: The Enabled State**

The most fundamental prerequisite for a component is its enabled state. This acts as a master switch. A component can be declared as disabled in its declarative metadata (enabled="false") or can be programmatically disabled at runtime through a component context API. If a component is in a disabled state, it can never become SATISFIED, regardless of whether its configuration or service dependencies are met. The runtime will not consider a disabled component for activation. This provides a coarse-grained, administrative control over the activation of components within a running system.

### **Prerequisite 2: Configuration Dependency Satisfaction (The Configuration Gatekeeper)**

After confirming a component is enabled, the runtime evaluates its configuration dependency, which is governed by the configurationPolicy attribute of the @Component annotation (or equivalent). This attribute dictates the component's relationship with a configuration management service and acts as the next gate in the satisfaction process.1

- **configurationPolicy="ignore"**: With this policy, the gate is always open. The component's lifecycle is completely independent of the configuration service. The runtime will not look for or apply any configuration objects, even if one with a matching Persistent Identifier (PID) exists.1 The component is unaffected by any configuration-related events.
- **configurationPolicy="optional" (Default)**: This policy also keeps the gate open, but with a crucial difference. The component configuration is allowed to become SATISFIED even if no corresponding configuration object is present. However, if a configuration object with a matching PID _does_ exist, the runtime _will_ use it, merging its properties into the component's properties before activation.1 The absence of a configuration does not block satisfaction, but its presence enhances it.
- **configurationPolicy="require"**: This policy closes the gate by default. A component with this policy has a mandatory dependency on a configuration object. The component configuration is blocked from becoming SATISFIED until a configuration object with a PID matching the component's name is available from the configuration service.1 The deletion of this required configuration object will cause an active component to become
  UNSATISFIED and subsequently be deactivated. This policy elevates a configuration from a simple source of properties to a critical, lifecycle-gating dependency, demonstrating the tight, specified integration between the Declarative Services and Configuration Admin concepts.1

### **Prerequisite 3: Service Reference Satisfaction**

Only after a component has passed the "enabled" and "configuration policy" gates does the runtime proceed to evaluate its service reference dependencies. The satisfaction of these references is determined by the cardinality attribute of the @Reference annotation, which specifies the number of matching services required for the component to be satisfied.

- **cardinality="1..1" or cardinality="1..n" (Mandatory)**: For a component to be satisfied, the service registry must contain at least one service that matches the reference's interface and, if specified, its target filter. The absence of such a service will keep the component configuration in the UNSATISFIED state or, if it was already ACTIVE, will cause it to transition back to UNSATISFIED, leading to its deactivation. The arrival of a suitable service is a primary trigger for satisfaction, an event driven by the framework's service event mechanism.3
- **cardinality="0..1" or cardinality="0..n" (Optional)**: These cardinalities indicate that the service dependency is optional. The component configuration can become SATISFIED even if no matching services are currently available in the registry. The runtime will bind services if they appear, but their absence does not block the component's activation.

This hierarchical evaluation of dependencies—Enabled, then Configuration, then Services—is not merely an implementation detail; it dictates a sound strategy for testing. A failure at an early stage, such as a missing required configuration, means that the runtime will not even begin to track service references for that component. Therefore, an automated test suite should be structured to mirror this logic. Test cases should be grouped to isolate failures at each level of the hierarchy. For example, one group of tests should verify that a disabled component never activates, irrespective of its dependencies. Another group should focus on configurationPolicy="require", confirming that the component remains UNSATISFIED without the necessary configuration object, even when all required services are present. Only for components that are verified to pass these initial gates should the test suite proceed to manipulate service availability to test reference satisfaction. This structured approach simplifies the diagnosis of test failures and ensures that each distinct aspect of the satisfaction logic is validated independently.

## **The Activation Event: From SATISFIED to ACTIVE**

The transition of a Component Instance from the INACTIVE state to the ACTIVE state is the culmination of the satisfaction process. The specific trigger and mechanism for this transition depend on the component's configuration, primarily its immediate attribute, whether it is a factory component, and the defined scope of the service it provides.1

### **Immediate Activation (immediate=true)**

For a component marked as immediate=true, activation is a direct and automatic consequence of its configuration becoming SATISFIED. The runtime does not wait for any external trigger. As soon as the last required dependency is fulfilled, the runtime initiates the activation sequence:

1. **Instantiation**: The runtime uses the environment's module loader to create a new instance of the component's implementation class.
2. **Dependency Injection**: All available and required dependencies are injected into the new instance. This includes binding service objects for all satisfied references (via field injection or bind methods) and providing the component's properties, which may include data from a configuration object.
3. **Activation Callback**: The runtime invokes the single method within the implementation class that is annotated with @Activate (or a similar lifecycle decorator). The successful completion of this method is required for activation to proceed. If this method throws an exception, the activation fails, the instance is discarded, and the component does not become ACTIVE.
4. **Service Registration**: If the component is declared to provide one or more services, the now-activated instance is registered as a service object in the service registry. This makes the component's functionality available to other modules in the environment.

### **Delayed Activation (immediate=false)**

Delayed activation, the default for components that provide a service, is the core mechanism for optimizing resource usage.1 When a delayed component's configuration becomes
SATISFIED, the runtime's actions are minimal:

1. **Service Factory Registration**: The runtime registers a special _service factory_ object in the service registry on behalf of the component. Crucially, it does **not** instantiate the component's implementation class. The component instance remains INACTIVE.
2. **Deferred Activation**: The activation is deferred until another module explicitly requests the service.
3. **Intercept and Activate**: The runtime, having registered the factory, intercepts this service request. Only at this moment does it perform the full activation sequence described for immediate components: instantiation, dependency injection, and invocation of the @Activate method. The newly activated instance is then returned to the module that requested the service.

This "just-in-time" activation ensures that the memory and CPU costs associated with creating and initializing a component are only incurred if its functionality is actually needed by the running system.

### **Factory Components**

A component that specifies the factory attribute in its metadata is a specialized form of delayed component. It is designed to allow other components to create multiple, distinct instances of it programmatically. The component itself is not activated when its dependencies are satisfied. Instead, the runtime registers a ComponentFactory service. Another module can obtain this ComponentFactory and call its newInstance() method. Each call to newInstance() triggers the runtime to create and activate a new, fully managed instance of the factory component. Each of these instances has its own lifecycle, independent of the others.

### **Service Scopes**

For delayed components that provide a service, the scope attribute further refines the activation behavior by controlling how component instances are created and shared among modules that request the service.1

- **singleton (Default)**: The first time any module requests the service, the runtime creates and activates a single component instance. All subsequent requests for that service, from any module, will receive a reference to this same, shared instance. There will only ever be one ACTIVE instance per SATISFIED component configuration.
- **bundle**: A new component instance is created for each distinct module that requests the service. If Module A requests the service, a new instance is created and returned. If Module B then requests the same service, a second, completely separate instance is created and returned. Module A will always receive the first instance, and Module B will always receive the second. This scope provides instance isolation between consuming modules.
- **prototype**: This scope provides the highest level of isolation. A new component instance is created and activated for _every single request_ for the service. If a module requests a service twice, it will receive two different instances. This scope is typically used when the service object is stateful and must not be shared under any circumstances.

To clarify these behaviors for testing purposes, the following table summarizes the triggers and outcomes for different component configurations.

| Component Type  | Service Scope    | Activation Trigger                                        | Number of Instances Created                   |
| :-------------- | :--------------- | :-------------------------------------------------------- | :-------------------------------------------- |
| immediate=true  | (Not Applicable) | All mandatory dependencies become satisfied.              | One instance is created automatically.        |
| immediate=false | singleton        | The first request for the service from any module.        | One shared instance for the entire framework. |
| immediate=false | bundle           | The first request for the service from a specific module. | One instance per unique requesting module.    |
| immediate=false | prototype        | Every request for the service.                            | One new instance per service request.         |
| factory=...     | (Not Applicable) | A call to ComponentFactory.newInstance().                 | One new instance per newInstance() call.      |

This table provides a clear, at-a-glance reference for designing test scenarios that correctly trigger and verify the creation of the appropriate number and type of component instances based on the component's declared activation policy and service scope.

## **Runtime Dynamics: Life in the ACTIVE State**

Once a component instance transitions to the ACTIVE state, its lifecycle is far from static. It must remain responsive to the highly dynamic runtime environment, where dependent services and configurations can change at any moment.1 The component's reaction to these changes is governed by the policies defined for its service references and its handling of configuration updates.

### **The Static Reference Policy (policy="static")**

A static reference policy dictates that the set of services bound to a component instance is immutable for the lifetime of that instance. The bindings are chosen by the runtime at the moment of activation and cannot be altered thereafter. Any change in the availability of these bound services that impacts the component's satisfaction will result in the deactivation and disposal of the entire instance.

- **policyOption="reluctant" (Default)**: This is the more conservative static option. If a service bound to a mandatory (1..1 or 1..n) reference is unregistered, the component configuration becomes UNSATISFIED. The runtime will then deactivate the instance by invoking its @Deactivate method. A new instance will only be activated if a suitable replacement service appears later. A reluctant component will ignore the appearance of new, higher-ranking services; it is content with the service it was bound to at activation and will not be disturbed unless that service disappears.
- **policyOption="greedy"**: The greedy option introduces a more aggressive rebinding behavior. Like the reluctant option, it will cause the component to be deactivated if a mandatory bound service is unregistered. However, it adds another condition for deactivation: if a new service is registered that is a "better" match for the reference (typically meaning it has a higher ranking property), the runtime is _forced_ to deactivate the current instance and activate a brand new one that is bound to the higher-ranking service. This ensures the component is always using the "best" available service, but at the cost of more frequent and disruptive deactivation/reactivation cycles.

### **The Dynamic Reference Policy (policy="dynamic")**

A dynamic reference policy allows an ACTIVE component instance to adapt to changes in service availability without being deactivated. The runtime can modify the set of bound services at runtime by invoking bind and unbind methods on the existing, active instance.

- **Service Arrival**: When a new service matching the reference is registered, the runtime invokes the corresponding bind method (e.g., bindMyService(...)) on the active instance, passing the new service object. The component remains ACTIVE and can immediately begin using the new service.
- **Service Departure**: When a bound service is unregistered, the runtime invokes the corresponding unbind method (e.g., unbindMyService(...)). The component remains ACTIVE and is responsible for gracefully handling the removal of the service. However, if the departure of this service violates a mandatory cardinality (e.g., the last service for a 1..n reference is removed), the component configuration will transition to UNSATISFIED, and the runtime will then proceed to deactivate the instance. This policy allows for much more graceful and efficient adaptation to the dynamic environment, fulfilling the "Reactive" principle of Declarative Services.1

### **Configuration Updates**

Changes made to a configuration object in the configuration service also trigger runtime events for any ACTIVE component that is bound to it. The component's reaction depends on whether it has implemented a specific lifecycle callback method for modifications.

- **With a @Modified Method**: If the component's implementation class contains a method annotated with @Modified, the runtime can perform an in-place update. When the configuration object is updated, the runtime calls the @Modified method on the _existing, active_ instance, passing the new set of properties. The component remains ACTIVE and is responsible for adapting its internal state to the new configuration.
- **Without a @Modified Method**: If the component does not have a @Modified method, the runtime has no way to inform the existing instance of the configuration change. The specification dictates that in this scenario, the runtime must treat the update as a more disruptive event.1 It performs a full deactivation/reactivation cycle: the current instance is deactivated (its
  @Deactivate method is called), and a new instance is created and activated with the updated properties.

There are two particularly subtle yet critical triggers for the deactivation of a healthy, satisfied component that must be accounted for in any compliant implementation. The first is the "Greedy Static Trap": the appearance of a higher-ranking service for a static/greedy reference forces a deactivation, not because of a dependency failure, but to satisfy the policy's requirement to bind to the best service. The logic is that since the bindings are static and fixed at activation, the only way to switch to a better service is to destroy the current instance and create a new one. The second is the "Missing Modified Deactivation": a configuration update for a component that lacks a @Modified method also forces a deactivation. The specification defines a configuration change in this context as an event that can cause the component to become unsatisfied, which in turn leads to deactivation.1 These are not intuitive behaviors, as they are proactive deactivations mandated by policy rather than reactive deactivations caused by dependency loss. A robust test suite must include specific scenarios to verify these behaviors, as they represent common sources of implementation error due to their counter-intuitive nature.

## **The Component Lifecycle Matrix**

The following matrix synthesizes the principles and rules established in the preceding sections into a formal, actionable model for testing. It details a representative set of scenarios covering the key state transitions of a declarative services component. Each row represents a distinct test case, specifying the initial conditions, the triggering event, and the expected, specification-compliant outcome. This matrix is designed to be directly translatable into an automated test suite.

| Scenario ID                   | Component Configuration              | Reference Configuration                                       | Initial State                                                       | Triggering Event                                     | Expected Final State                             | Lifecycle Methods Invoked                    | Governing Specification |
| :---------------------------- | :----------------------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------ | :--------------------------------------------------- | :----------------------------------------------- | :------------------------------------------- | :---------------------- |
| **Satisfaction & Activation** |                                      |                                                               |                                                                     |                                                      |                                                  |                                              |                         |
| SA-IMM-01                     | immediate=true                       | cardinality="1..1"                                            | UNSATISFIED. Required service S is absent.                          | Service S is registered.                             | ACTIVE.                                          | bindS(), @Activate                           | Compendium 112.4.5 1    |
| SA-DLY-01                     | immediate=false, provides service P  | cardinality="1..1"                                            | UNSATISFIED. Required service S is absent.                          | Service S is registered.                             | SATISFIED/INACTIVE. Service P is registered.     | (none)                                       | Compendium 112.4.6 1    |
| SA-DLY-02                     | immediate=false, provides service P  | cardinality="1..1"                                            | SATISFIED/INACTIVE. Service P is registered.                        | Another module calls getService(P).                  | ACTIVE.                                          | bindS(), @Activate                           | Compendium 112.4.6 1    |
| SA-CFG-01                     | configurationPolicy="require"        | (none)                                                        | UNSATISFIED. Required configuration C is absent.                    | Configuration object C is created.                   | SATISFIED/ACTIVE (if immediate=true).            | @Activate                                    | Compendium 112.4.3 1    |
| SA-CFG-02                     | configurationPolicy="require"        | cardinality="1..1"                                            | UNSATISFIED. Required service S is present, but config C is absent. | Configuration object C is created.                   | SATISFIED/ACTIVE (if immediate=true).            | bindS(), @Activate                           | Compendium 112.4.3 1    |
| **Static Policy Dynamics**    |                                      |                                                               |                                                                     |                                                      |                                                  |                                              |                         |
| SP-REL-01                     | immediate=true                       | cardinality="1..1", policy="static", policyOption="reluctant" | ACTIVE. Bound to service S1.                                        | Service S1 is unregistered.                          | UNSATISFIED/INACTIVE.                            | unbindS1(), @Deactivate                      | Compendium 112.5.13     |
| SP-REL-02                     | immediate=true                       | cardinality="1..1", policy="static", policyOption="reluctant" | ACTIVE. Bound to service S1 (rank 5).                               | A higher-ranked service S2 (rank 10\) is registered. | ACTIVE. Remains bound to S1.                     | (none)                                       | Compendium 112.5.13     |
| SP-GRD-01                     | immediate=true                       | cardinality="1..1", policy="static", policyOption="greedy"    | ACTIVE. Bound to service S1 (rank 5).                               | A higher-ranked service S2 (rank 10\) is registered. | ACTIVE. New instance is created and bound to S2. | unbindS1(), @Deactivate, bindS2(), @Activate | Compendium 112.5.14     |
| SP-GRD-02                     | immediate=true                       | cardinality="1..1", policy="static", policyOption="greedy"    | ACTIVE. Bound to service S1.                                        | Service S1 is unregistered.                          | UNSATISFIED/INACTIVE.                            | unbindS1(), @Deactivate                      | Compendium 112.5.14     |
| **Dynamic Policy Dynamics**   |                                      |                                                               |                                                                     |                                                      |                                                  |                                              |                         |
| DP-ADD-01                     | immediate=true                       | cardinality="0..n", policy="dynamic"                          | ACTIVE. No services bound.                                          | Service S1 is registered.                            | ACTIVE. Bound to S1.                             | bindS1()                                     | Compendium 112.5.15     |
| DP-REM-01                     | immediate=true                       | cardinality="1..n", policy="dynamic"                          | ACTIVE. Bound to services S1 and S2.                                | Service S1 is unregistered.                          | ACTIVE. Remains bound to S2.                     | unbindS1()                                   | Compendium 112.5.15     |
| DP-REM-02                     | immediate=true                       | cardinality="1..1", policy="dynamic"                          | ACTIVE. Bound to service S1.                                        | Service S1 is unregistered.                          | UNSATISFIED/INACTIVE.                            | unbindS1(), @Deactivate                      | Compendium 112.5.15     |
| **Configuration Updates**     |                                      |                                                               |                                                                     |                                                      |                                                  |                                              |                         |
| CU-MOD-01                     | immediate=true, has @Modified method | (none)                                                        | ACTIVE. Using configuration C1.                                     | Configuration object C is updated to C2.             | ACTIVE. State updated in place.                  | @Modified                                    | Compendium 112.4.3 1    |
| CU-NOM-01                     | immediate=true, no @Modified method  | (none)                                                        | ACTIVE. Using configuration C1.                                     | Configuration object C is updated to C2.             | ACTIVE. New instance created with C2.            | @Deactivate, @Activate                       | Compendium 112.4.3 1    |
| CU-DEL-01                     | configurationPolicy="require"        | (none)                                                        | ACTIVE. Using configuration C.                                      | Configuration object C is deleted.                   | UNSATISFIED/INACTIVE.                            | @Deactivate                                  | Compendium 112.4.3 1    |

## **Conclusion and Recommendations for Test Suite Architecture**

### **Summary of the Formal Model**

The lifecycle of an OSGi Declarative Services component is governed by a precise and deterministic set of rules that can be formally modeled. The core of this model is the separation of the Component Configuration state (UNSATISFIED, SATISFIED) from the Component Instance state (INACTIVE, ACTIVE). This dual state machine model is essential for understanding the behavior of delayed components, which are fundamental to the performance characteristics of the DS specification.1
The transition to a SATISFIED state is contingent upon a strict hierarchy of preconditions: the component must first be enabled, then its configurationPolicy must be met, and finally, all of its mandatory service references must be fulfilled. Activation of an instance is then triggered based on the immediate attribute and service scope, with delayed components deferring instantiation until their service is explicitly requested. Once ACTIVE, a component's stability is determined by its reference policies (static vs. dynamic) and its ability to handle configuration updates (via the @Modified method). This model reveals non-obvious deactivation triggers, such as the appearance of a higher-ranking service for a static/greedy reference or a configuration update for a component lacking a @Modified method, which are critical edge cases for ensuring full specification compliance.

### **Recommended Test Suite Architecture**

Based on this formal model, a comprehensive and maintainable automated test suite should be structured into logical groups that mirror the distinct phases and aspects of the component lifecycle. This approach isolates behaviors, simplifies debugging, and ensures systematic coverage of the specification. The following structure is recommended:

- Group A: Satisfaction Tests
  This group should focus exclusively on the UNSATISFIED to SATISFIED transition of the Component Configuration. Tests should systematically validate the hierarchy of dependencies.
  - Test that a disabled component never becomes satisfied.
  - For configurationPolicy="require", test all permutations: with and without the required Configuration object, and with and without required services present, verifying that the configuration is the primary gatekeeper.
  - For components that pass the initial gates, test all cardinality options by dynamically registering and unregistering services to trigger satisfaction and unsatisfaction.
- Group B: Activation Tests
  This group focuses on the INACTIVE to ACTIVE transition of the Component Instance.
  - Contrast immediate=true (activates on satisfaction) with immediate=false (activates on first service use).
  - Verify the intermediate SATISFIED/INACTIVE state for delayed components.
  - Test factory components by calling newInstance() and verifying that distinct, managed instances are created.
  - Test all service scopes (singleton, bundle, prototype) by having multiple modules request the service and asserting that the correct number of instances are created and shared (or not shared) as per the specification.1
- Group C: Static Rebinding Tests
  This group should be dedicated to the complex and often disruptive behavior of the static reference policy.
  - Create sub-groups for reluctant and greedy policy options.
  - For reluctant, verify that the component is deactivated when a bound service disappears but ignores the arrival of better services.
  - For greedy, verify the "Greedy Static Trap": test that the component instance is fully replaced (deactivated and reactivated) upon the arrival of a higher-ranking service.
- Group D: Dynamic Update Tests
  This group validates the graceful, in-place updates of the dynamic reference policy.
  - Register new services and verify that the bind method is called on the existing ACTIVE instance.
  - Unregister services and verify that the unbind method is called.
  - Test the boundary condition where unbinding the last mandatory service causes a full deactivation.
- Group E: Configuration Update Tests
  This group focuses on the component's reaction to changes from the Configuration Admin service.
  - Test components with a @Modified method, verifying that the method is called and the instance remains ACTIVE after a configuration update.
  - Test components without a @Modified method, verifying the "Missing Modified Deactivation" behavior: the instance is fully replaced upon a configuration update.
  - Test the deletion of a required configuration for a configurationPolicy="require" component, ensuring it leads to deactivation.

Adherence to this formal model and the recommended test architecture will facilitate the development of a port that is not merely functional but is verifiably compliant with the nuanced and complex behavior defined by the OSGi R7 specifications. This structured approach ensures that all critical lifecycle transitions, including subtle edge cases, are rigorously tested, leading to a robust and reliable implementation.

#### **Works cited**

1. 112 Declarative Services Specification \- OSGi Compendium 7, accessed August 28, 2025, [https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html](https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html)
2. 104 Configuration Admin Service Specification \- OSGi Compendium 7, accessed August 28, 2025, [https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.cm.html](https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.cm.html)
3. 5 Service Layer \- OSGi Core 7 \- OSGi Docs, accessed August 28, 2025, [https://docs.osgi.org/specification/osgi.core/7.0.0/framework.service.html](https://docs.osgi.org/specification/osgi.core/7.0.0/framework.service.html)
