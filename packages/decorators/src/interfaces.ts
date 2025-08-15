/**
 * Types describing OSGi Declarative Services (DS) metadata.
 * Terminology and semantics follow the OSGi Compendium Specification, Declarative Services (R7+).
 */
export type OSGiConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Component metadata roughly corresponding to a DS <component/> element.
 */
export interface ComponentDescriptor {
  /**
   * The component name (component.name). Must be unique within the bundle.
   */
  name: string;

  /**
   * The implementation class of the component (implementation/@class). Can be a class reference
   * or its name. This is the type whose instances form the component.
   */
  implementation: string | Function;

  /**
   * Optional direct reference to the component class constructor used by decorators/utilities.
   * Not an OSGi attribute per se, but useful for runtime reflection.
   */
  class?: any;

  /**
   * Component properties (component/property and component/properties). These become both component
   * and service registration properties when the component is registered as a service.
   */
  properties?: Record<string, any>;

  /**
   * Service reference descriptors (reference elements) required or used by this component.
   */
  references?: ReferenceDescriptor[];

  /**
   * Name of the activate method (activate attribute). Called when the component is activated.
   */
  activate?: string;

  /**
   * Name of the deactivate method (deactivate attribute). Called before the component is deactivated.
   */
  deactivate?: string;

  /**
   * Name of the modified method (modified attribute). Called when bound configuration/properties change.
   */
  modified?: string;

  /**
   * Configuration PID(s) associated with this component (configuration-pid). If absent, defaults to
   * the component name. Used with Configuration Admin.
   */
  configurationPid?: string;

  /**
   * Configuration policy (configuration-policy):
   * - 'optional' — component can activate with or without configuration.
   * - 'require'  — configuration is required for activation.
   * - 'ignore'   — provided configuration is ignored.
   */
  configurationPolicy?: 'optional' | 'require' | 'ignore';

  /**
   * Factory component name (factory attribute). When set, the component acts as a factory and each
   * configuration creates a new component instance.
   */
  factory?: string;

  /**
   * Immediate activation flag (immediate attribute). If true, activate the component even if it does
   * not register a service; otherwise, activate on first service use.
   */
  immediate?: boolean;

  /**
   * Whether the component is enabled at bundle start (enabled attribute). Disabled components do not
   * activate until enabled programmatically.
   */
  enabled?: boolean;

  /**
   * Component scope (scope attribute):
   * - 'singleton' — one shared instance per bundle.
   * - 'bundle'    — one instance per using bundle when registered as a service.
   * - 'prototype' — a new instance for each service consumer (prototype scope).
   */
  scope?: 'singleton' | 'bundle' | 'prototype';

  /**
   * Service registration information (service element). Defines interfaces and optional scope for
   * the service this component provides.
   */
  service?: ServiceDescriptor;
}

/**
 * A service reference used by a component (reference element).
 */
export interface ReferenceDescriptor {
  /**
   * The reference name (reference/@name). Used to identify lifecycle methods and fields.
   */
  name: string;

  /**
   * The service interface this reference binds to (reference/@interface).
   */
  interface: string;

  /**
   * Cardinality (reference/@cardinality):
   * - '1..1' — mandatory, single
   * - '0..1' — optional, single
   * - '1..n' — mandatory, multiple
   * - '0..n' — optional, multiple
   */
  cardinality: '1..1' | '0..1' | '1..n' | '0..n';

  /**
   * Policy (reference/@policy): 'static' — component must be deactivated to change bindings;
   * 'dynamic' — bindings may change without deactivation.
   */
  policy: 'static' | 'dynamic';

  /**
   * Policy option (reference/@policy-option):
   * - 'reluctant' — prefer existing bound services unless they become unavailable.
   * - 'greedy'    — rebind to a better match as soon as it is available.
   */
  policyOption?: 'reluctant' | 'greedy';

  /**
   * Target LDAP filter (reference/@target) applied to the referenced service properties.
   */
  target?: string;

  /**
   * Bind method name (reference/@bind). Called to bind a matching service.
   */
  bind?: string;

  /**
   * Unbind method name (reference/@unbind). Called to unbind a leaving service.
   */
  unbind?: string;

  /**
   * Updated method name (reference/@updated). Called when a bound service's properties change.
   */
  updated?: string;

  /**
   * Field name for field injection (reference field injection per DS). If set, the framework will
   * inject the reference into the named field.
   */
  field?: string;

  /**
   * Field update strategy (reference/@field-option):
   * - 'replace' — replace the field value on updates.
   * - 'update'  — update contents in place when possible.
   */
  fieldOption?: 'replace' | 'update';

  /**
   * Required service scope for the referenced service (reference/@scope):
   * - 'bundle'              — bound service must have bundle scope.
   * - 'prototype'           — bound service must have prototype scope.
   * - 'prototype_required'  — component itself requires prototype scope for correct use.
   */
  scope?: 'bundle' | 'prototype' | 'prototype_required';
}

/**
 * Service registration metadata (service element) for the provided component service.
 */
export interface ServiceDescriptor {
  /**
   * Interfaces under which the service is registered (service/@interfaces). If omitted, the
   * implementation class' interfaces may be used depending on framework behavior.
   */
  interfaces?: string[];

  /**
   * Service scope (service/@scope): 'singleton', 'bundle', or 'prototype' as defined by DS R7.
   */
  scope?: 'singleton' | 'bundle' | 'prototype';
}
