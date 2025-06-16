import type { ComponentProps, ReferenceProps } from './interfaces';
import {
  $$PANDINO_META,
  COMPONENT_ACTIVATE_KEY_METHOD,
  COMPONENT_DEACTIVATE_KEY_METHOD,
  COMPONENT_KEY_CONFIGURATION_PID,
  COMPONENT_KEY_CONFIGURATION_POLICY,
  COMPONENT_KEY_NAME,
  COMPONENT_KEY_PROPERTY,
  COMPONENT_KEY_SERVICE,
  COMPONENT_MODIFIED_KEY_METHOD,
  REFERENCE_KEY_BIND,
  REFERENCE_KEY_CARDINALITY,
  REFERENCE_KEY_POLICY,
  REFERENCE_KEY_POLICY_OPTION,
  REFERENCE_KEY_SCOPE,
  REFERENCE_KEY_SERVICE,
  REFERENCE_KEY_TARGET,
  REFERENCE_KEY_UNBIND,
  REFERENCE_KEY_UPDATED,
} from './constants';
import type { InternalMetaData, InternalReferenceMetaData } from './internal-interfaces';
import { decoratedQueue } from './state';

export function Component(props: ComponentProps) {
  return <T extends new (...args: any[]) => any>(target: T): T => {
    const originalConstructor = target;

    function modifiedConstructor(...args: any[]) {
      const instance = new originalConstructor(...args);

      // do stuff here

      return instance;
    }

    modifiedConstructor.prototype = originalConstructor.prototype;

    const internalMeta = getOrInitInternalMetaData(modifiedConstructor.prototype);

    internalMeta[COMPONENT_KEY_NAME] = props.name;
    internalMeta[COMPONENT_KEY_SERVICE] =
      typeof props.service === 'string' || (Array.isArray(props.service) && props.service.length > 0) ? props.service : props.name;
    internalMeta[COMPONENT_KEY_CONFIGURATION_PID] = props.configurationPid ?? internalMeta[COMPONENT_KEY_SERVICE];
    internalMeta[COMPONENT_KEY_CONFIGURATION_POLICY] = props.configurationPolicy ?? 'OPTIONAL';

    if (props.property) {
      internalMeta[COMPONENT_KEY_PROPERTY] = props.property;
    }

    decoratedQueue.add(modifiedConstructor);

    return modifiedConstructor as unknown as T;
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-field.injection
 * https://osgi.github.io/osgi/cmpn/service.component.html#service.component-reference.policy
 *
 * @param {ReferenceProps} props
 * @constructor
 */
export function Reference(props: ReferenceProps) {
  return (target: any, key: string | symbol) => {
    const internalMeta = getOrInitInternalMetaData(target);

    const referenceMetaData: InternalReferenceMetaData = {
      [REFERENCE_KEY_SERVICE]: props.service,
      [REFERENCE_KEY_CARDINALITY]: props.cardinality ? props.cardinality : 'MANDATORY',
      [REFERENCE_KEY_POLICY]: props.policy ? props.policy : 'STATIC',
      [REFERENCE_KEY_POLICY_OPTION]: props.policyOption ? props.policyOption : 'GREEDY',
      [REFERENCE_KEY_SCOPE]: props.scope ? props.scope : 'SINGLETON',
    };

    if (props.target) {
      referenceMetaData[REFERENCE_KEY_TARGET] = props.target;
    }

    if (props.bind) {
      referenceMetaData[REFERENCE_KEY_BIND] = props.bind;
    }

    if (props.updated) {
      referenceMetaData[REFERENCE_KEY_UPDATED] = props.updated;
    }

    if (props.unbind) {
      referenceMetaData[REFERENCE_KEY_UNBIND] = props.unbind;
    }

    internalMeta.references[key] = referenceMetaData;
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-activation
 *
 * @constructor
 */
export function Activate() {
  // biome-ignore lint/complexity/noBannedTypes: Object is fine here
  return (target: Object, key: string | symbol, descriptor: PropertyDescriptor) => {
    const internalMeta = getOrInitInternalMetaData(target);
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return original.apply(this, args);
    };

    internalMeta[COMPONENT_ACTIVATE_KEY_METHOD] = {
      method: key,
    };

    return descriptor;
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-deactivation
 *
 * @constructor
 */
export function Deactivate() {
  // biome-ignore lint/complexity/noBannedTypes: Object is fine here
  return (target: Object, key: string | symbol, descriptor: PropertyDescriptor) => {
    const internalMeta = getOrInitInternalMetaData(target);
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return original.apply(this, args);
    };

    internalMeta[COMPONENT_DEACTIVATE_KEY_METHOD] = {
      method: key,
    };

    return descriptor;
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-component.annotations
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-modification
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#org.osgi.service.component.annotations.Modified
 *
 * @constructor
 */
export function Modified() {
  // biome-ignore lint/complexity/noBannedTypes: Object is fine here
  return (target: Object, key: string | symbol, descriptor: PropertyDescriptor) => {
    const internalMeta = getOrInitInternalMetaData(target);
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return original.apply(this, args);
    };

    internalMeta[COMPONENT_MODIFIED_KEY_METHOD] = {
      method: key,
    };

    return descriptor;
  };
}

function getOrInitInternalMetaData(target: any): InternalMetaData {
  let internalMeta: InternalMetaData;

  if (!target[$$PANDINO_META]) {
    internalMeta = {
      references: {},
    } as unknown as InternalMetaData;
    target[$$PANDINO_META] = internalMeta;
  } else {
    internalMeta = target[$$PANDINO_META];
  }

  return internalMeta;
}
