import { BundleContext, ServiceProperties, ServiceReference } from '@pandino/pandino-api';

export type ConfigurationPolicy = 'IGNORE' | 'OPTIONAL' | 'REQUIRE';
export type ReferenceCardinality = 'MANDATORY' | 'OPTIONAL';
export type ReferencePolicy = 'STATIC' | 'DYNAMIC';
export type ReferencePolicyOption = 'RELUCTANT' | 'GREEDY';
export type ReferenceScope = 'BUNDLE' | 'PROTOTYPE';

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
   * Returns the BundleContext of the bundle which declares this component.
   *
   * @return BundleContext
   */
  getBundleContext(): BundleContext;

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
   * @return ServiceReference<S> | undefined
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
