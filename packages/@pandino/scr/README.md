# scr

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

WIP

## Sources

- https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-service.component.runtime

## Notes

https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-components

**112.2 Components**

Component configurations are activated and deactivated under the full control of SCR.

SCR must activate a component configuration when the component is enabled and the component configuration is satisfied
and a component configuration is needed. During the life time of a component configuration, SCR can notify the component
of changes in its bound references.

SCR will deactivate a previously activated component configuration when the component becomes disabled, the component
configuration becomes unsatisfied, or the component configuration is no longer needed.

If an activated component configuration's configuration properties change, SCR must either notify the component
configuration of the change, if the component description specifies a method to be notified of such changes, or
deactivate the component configuration and then attempt to reactivate the component configuration using the new
configuration information.

**112.2.2 Immediate Component**

An immediate component is activated as soon as its dependencies are satisfied.

If an immediate component has no dependencies, it is activated immediately.

A component is an immediate component if it is not a factory component and either does not specify a service or
specifies a service and the immediate attribute of the component element set to true. If an immediate component
configuration is satisfied and specifies a service, SCR must register the component configuration as a service in the
service registry and then activate the component configuration.

**112.3 References to Services**

The services that are selected by a reference are called the target services. These are the services selected by the
`BundleContext.getServiceReferences` method where

- the first argument is the reference's interface and
- the second argument is the reference's target property, which must be a valid filter.

A component configuration becomes satisfied when each specified reference is satisfied.

A reference is satisfied if it specifies optional cardinality or when the number of target services is equal to or more
than the minimum cardinality of the reference.

An activated component configuration that becomes unsatisfied must be deactivated.

**112.3.10 Selecting Target Services**

The target services for a reference are constrained by the reference's interface name and target property.

By specifying a filter in the target property, the programmer and deployer can constrain the set of services that should
be part of the target services.

**112.3.11 Circular References**

SCR must ensure that a component instance is never accessible to another component instance or as a service until it has
been fully activated, that is it has returned from its activate method if it has one.

Circular references must be detected by SCR when it attempts to satisfy component configurations and SCR must fail to
satisfy the references involved in the cycle and log an error message with the Log Service, if present.

However, if one of the references in the cycle has optional cardinality SCR must break the cycle.

The reference with the optional cardinality can be satisfied and bound to zero target services. Therefore the cycle is
broken and the other references may be satisfied.

**112.5.6 Activation**

Activating a component configuration consists of the following steps:

- Load the component implementation class.
- Compute the bound services. See Bound Services.
- Create the component context. See Component Context.
- Construct the component instance. See Constructor Injection.
- Set the activation fields, if any. See Activation Objects.
- Bind the bound services. See Binding Services.
- Call the activate method, if any. See Activate Method. Calling the activate method signals the completion of activating the component instance.

Component instances must never be reused.

Each time a component configuration is activated, SCR must create a new component instance to use with the activated
component configuration.

A component instance must complete activation before it can be deactivated.

Once the component configuration is deactivated or fails to activate due to an exception, SCR must unbind all the
component's bound services and discard all references to the component instance associated with the activation.

**112.5.8 Component Context**

The Component Context can be made available to a component instance during activation, modification, and deactivation.

It provides the interface to the execution context of the component, much like the Bundle Context provides a bundle the
interface to the Framework. A Component Context should therefore be regarded as a capability and not shared with other
components or bundles.

Each distinct component instance receives a unique Component Context.

Component Contexts are not reused and must be discarded when the component configuration is deactivated.

**112.5.12 Bound Service Replacement**

If an active component configuration has a dynamic reference with unary cardinality and the bound service is modified or
unregistered and ceases to be a target service, or the policy-option is greedy and a better target service becomes
available then SCR must attempt to replace the bound service with a new bound service.

If the dynamic reference falls below the minimum cardinality, the component configuration must be deactivated because
the cardinality constraints will be violated.

If a component configuration has a static reference and a bound service is modified or unregistered and ceases to be a
target service, or the policy-option is greedy and a better target service becomes available then SCR must deactivate
the component configuration.

Afterwards, SCR must attempt to activate the component configuration again if another target service can be used as a
replacement for the outgoing service.

**112.5.15 Modified Method**

If a modified method is located, SCR must call this method to notify the component configuration of changes to the
component properties. If the modified method throws an exception, SCR must log an error message containing the exception
with the Log Service, if present and continue processing the modification.

**112.5.16 Deactivation**

Deactivating a component configuration consists of the following steps:

- Call the deactivate method, if present. See Deactivate Method.
- Unbind any bound services. See Unbinding.
- Release all references to the component instance and component context.

A component instance must complete activation or modification before it can be deactivated.

A component configuration can be deactivated for a variety of reasons. The deactivation reason can be received by the
deactivate method. The following reason values are defined:

- `DEACTIVATION_REASON_UNSPECIFIED` - Unspecified.
- `DEACTIVATION_REASON_DISABLED` - The component was disabled.
- `DEACTIVATION_REASON_REFERENCE` - A reference became unsatisfied.
- `DEACTIVATION_REASON_CONFIGURATION_MODIFIED` - A configuration was changed.
- `DEACTIVATION_REASON_CONFIGURATION_DELETED` - A configuration was deleted.
- `DEACTIVATION_REASON_DISPOSED` - The component was disposed.
- `DEACTIVATION_REASON_BUNDLE_STOPPED` - The bundle was stopped.

Once the component configuration is deactivated, SCR must discard all references to the component instance and component
context associated with the activation.

**112.5.17 Deactivate Method**

The deactivate method can take zero or more parameters. Each parameter must be assignable from one of the following types:

- One of the activation object types.
- `number` - The reason the component configuration is being deactivated. See Deactivation.

**112.6 Component Properties**

SCR always adds the following component properties, which cannot be overridden:

- component.name - The component name.
- component.id - A unique value ( Long) that is larger than all previously assigned values.

**112.7.1 Configuration Changes**

SCR must track changes in the Configuration objects matching the configuration PIDs of a component description.

Changes include the creating, updating and deleting of Configuration objects matching the configuration PIDs.

The actions SCR must take when a configuration change for a component configuration occurs are based upon how the
configuration-policy and modified attributes are specified in the component description, whether a component
configuration becomes satisfied, remains satisfied or becomes unsatisfied and the type and number of matching
Configuration objects.

With targeted PIDs, multiple Configuration objects can exist which can match a configuration PID.

Creation of a Configuration object with a better matching PID than a Configuration object currently being used by a
component configuration results in a configuration change for the component configuration with the new Configuration
object replacing the currently used Configuration object.

Deletion of a Configuration object currently being used by a component configuration when there is another Configuration
object matching the configuration PID also results in a configuration change for the component configuration with the
Configuration object having the best matching PID replacing the currently used, and now deleted, Configuration object.

**112.7.1.1 Ignore Configuration Policy**

For configuration-policy of ignore, component configurations are unaffected by configuration changes since the component
properties do not include properties from Configuration objects.

**112.7.1.2 Require Configuration Policy**

For configuration-policy of require, component configurations require a Configuration object for each specified
configuration PID.

A configuration change can cause a component configuration to become unsatisfied if any of the following occur:

- Each configuration PID of the component description does not have a matching Configuration object.
- A target property change results in a bound service of a static reference ceasing to be a target service.
- A target property change results in unbound target services for a static reference with the greedy policy option.
- A target property change or minimum cardinality property change results in a reference falling below the minimum cardinality.
- The component description does not specify the modified attribute.

**112.7.1.3 Optional Configuration Policy**

For configuration-policy of optional, component configurations do not require Configuration objects.

Since matching Configuration objects are optional, component configurations can be satisfied with zero or more matched
configuration PIDs.

If a Configuration object is then created which matches a configuration PID, this is a configuration change for the
component configurations that are not using the created Configuration object.

If a Configuration object is deleted which matches a configuration PID, this is a configuration change for the component
configurations using the deleted Configuration object.

A configuration change can cause a component configuration to become unsatisfied if any of the following occur:

- A target property change results in a bound service of a static reference ceasing to be a target service.
- A target property change results in unbound target services for a static reference with the greedy policy option.
- A target property change or minimum cardinality property change results in a reference falling below the minimum cardinality.
- The component description does not specify the modified attribute.

**112.7.1.4 Configuration Change Actions**

If a component configuration becomes unsatisfied:

- SCR must deactivate the component configuration
- If the component configuration was not created from a factory component, SCR must attempt to satisfy the component configuration with the current configuration state.

If a component configuration remains satisfied:

- If the component configuration has been activated, the modified method is called to provide the updated component properties. See Modification for more information.
- If the component configuration is registered as a service, SCR must modify the service properties.

**112.9.2 Starting and Stopping SCR**

When SCR is implemented as a bundle, any component configurations activated by SCR must be deactivated when the SCR
bundle is stopped.

When the SCR bundle is started, it must process any components that are declared in bundles that are started. This
includes bundles which are started and are awaiting lazy activation.

**112.9.7 Capabilities**

SCR must provide the following capabilities.

- A capability in the osgi.extender namespace declaring an extender with the name `COMPONENT_CAPABILITY_NAME`.

A bundle that contains service components should require the osgi.extender capability from SCR.

SCR must only process a bundle's service components if one of the following is true:

- The bundle's wiring has a required wire for at least one osgi.extender capability with the name osgi.component and the first of these required wires is wired to SCR.
- The bundle's wiring has no required wire for an osgi.extender capability with the name osgi.component.

Otherwise, SCR must not process the bundle's service components.

## License

Eclipse Public License - v 2.0
