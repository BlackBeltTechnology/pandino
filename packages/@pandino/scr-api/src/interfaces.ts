import type { BundleContext, ServiceProperties, ServiceReference } from '@pandino/pandino-api';

export type ConfigurationPolicy = 'IGNORE' | 'OPTIONAL' | 'REQUIRE';
export type ReferenceCardinality = 'MANDATORY' | 'OPTIONAL';

/**
 * The static policy is the most simple policy and is the default policy.
 *
 * A component instance never sees any of the dynamics. Component configurations are deactivated before any bound
 * service for a reference having a static policy becomes unavailable. If a target service is available to replace the
 * bound service which became unavailable, the component configuration must be reactivated and bound to the replacement
 * service.
 *
 * The dynamic policy is slightly more complex since the component implementation must properly handle changes in the
 * set of bound services. With the dynamic policy, SCR can change the set of bound services without deactivating a
 * component configuration. If the component uses method injection to access services, then the component instance will
 * be notified of changes in the set of bound services by calls to the bind and unbind methods.
 */
export type ReferencePolicy = 'STATIC' | 'DYNAMIC';

/**
 * The reluctant policy option is the default policy option for both static and dynamic reference policies.
 *
 * When a new target service for a reference becomes available, references having the reluctant policy option for the
 * static policy or the dynamic policy with a unary cardinality will ignore the new target service.
 *
 * The greedy policy option is a valid policy option for both static and dynamic reference policies.
 *
 * When a new target service for a reference becomes available, references having the greedy policy option will bind the
 * new target service.
 */
export type ReferencePolicyOption = 'RELUCTANT' | 'GREEDY';
export type ReferenceScope = 'BUNDLE' | 'PROTOTYPE';
export type ComponentConfigurationState = 'UNSATISFIED_CONFIGURATION' | 'UNSATISFIED_REFERENCE' | 'SATISFIED' | 'ACTIVE' | 'FAILED_ACTIVATION';

export interface ComponentConfiguration<S> {
  getId(): number;
  getPID(): string | string[];
  getConfigurationPolicy(): ConfigurationPolicy;
  getProperties(): ServiceProperties;
  getSatisfiedReferences(): SatisfiedReference[];
  getUnsatisfiedReferences(): UnsatisfiedReference[];
  getService(): ServiceReference<S> | undefined;
  getState(): ComponentConfigurationState;
}

export interface SatisfiedReference {
  getName(): string;
  getTarget(): string | undefined;
  getBoundServices(): ServiceReference<any>[];
}

export interface UnsatisfiedReference {
  getName(): string;
  getTarget(): string | undefined;
}

export interface ComponentInstance<S> {
  /**
   * Dispose of the component configuration for this component instance. The component configuration will be
   * deactivated. If the component configuration has already been deactivated, this method does nothing.
   */
  dispose(): void;

  /**
   * Returns the component instance of the activated component configuration.
   */
  getInstance(): S;
}

/**
 * The Component Context can be made available to a component instance during activation, modification, and
 * deactivation. It provides the interface to the execution context of the component, much like the Bundle Context
 * provides a bundle the interface to the Framework. A Component Context should therefore be regarded as a capability
 * and not shared with other components or bundles.
 *
 * Each distinct component instance receives a unique Component Context. Component Contexts are not reused and must be
 * discarded when the component configuration is deactivated.
 */
export interface ComponentContext<S> {
  /**
   * Disables the specified component name. The specified component name must be in the same bundle as this component.
   *
   * @param {string} name
   */
  disableComponent(name: string): void;

  /**
   * Enables the specified component name. The specified component name must be in the same bundle as this component.
   *
   * @param {string} name
   */
  enableComponent(name: string): void;

  /**
   * Returns the BundleContext of the bundle which declares this component.
   *
   * @return BundleContext
   */
  getBundleContext(): BundleContext;

  /**
   * Returns the Component Instance object for the component instance associated with this Component Context.
   */
  getComponentInstance(): ComponentInstance<S>;

  /**
   * Returns the component properties for this Component Context.
   *
   * @return ServiceProperties
   */
  getProperties(): ServiceProperties;

  /**
   * If the component instance is registered as a service using the service element, then this method returns the
   * service reference of the service provided by this component instance.
   *
   * @return ServiceReference<S>
   */
  getServiceReference(): ServiceReference<S> | undefined;
}

export interface ComponentProps {
  name: string; // Should be a fully qualified type name for the component
  service?: string | string[]; // Used as objectClass, typically the interface(es) which the class implements
  property?: ServiceProperties;
  configurationPid?: string | string[]; // If no value is specified, the name of this Component is used as the configuration PID of this Component.

  /**
   * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-configuration.changes
   */
  configurationPolicy?: ConfigurationPolicy; // Default: OPTIONAL
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#org.osgi.service.component.annotations.Reference
 */
export interface ReferenceProps {
  service: string; // the objectClass of the type on which this decorator is defined on
  target?: string; // filter
  cardinality?: ReferenceCardinality; // default: MANDATORY
  policy?: ReferencePolicy; // default: STATIC
  policyOption?: ReferencePolicyOption; // default: RELUCTANT
  scope?: ReferenceScope; // default: BUNDLE
}

export interface ComponentRegistrar {
  registerComponent(target: any, bundleContext: BundleContext): void;
}
