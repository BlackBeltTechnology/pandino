import 'reflect-metadata';
import { ComponentProps, ReferenceProps } from './interfaces';
import {
  COMPONENT_ACTIVATE_KEY_METHOD,
  COMPONENT_DEACTIVATE_KEY_METHOD,
  COMPONENT_KEY_CONFIGURATION_PID,
  COMPONENT_KEY_CONFIGURATION_POLICY,
  COMPONENT_KEY_NAME,
  COMPONENT_KEY_PROPERTY,
  COMPONENT_KEY_SERVICE,
  COMPONENT_MODIFIED_KEY_METHOD,
  REFERENCE_KEY_CARDINALITY,
  REFERENCE_KEY_SERVICE,
} from './constants';

export function Component(props: ComponentProps) {
  return function <T extends new (...args: any[]) => any>(target: T): T {
    const originalConstructor = target;

    function modifiedConstructor(...args: any[]) {
      const instance = new originalConstructor(...args);

      // do stuff here

      return instance;
    }

    modifiedConstructor.prototype = originalConstructor.prototype;

    Reflect.defineMetadata(COMPONENT_KEY_NAME, props.name, modifiedConstructor);
    Reflect.defineMetadata(
      COMPONENT_KEY_SERVICE,
      typeof props.service === 'string' || (Array.isArray(props.service) && props.service.length > 0)
        ? props.service
        : props.name,
      modifiedConstructor,
    );
    Reflect.defineMetadata(COMPONENT_KEY_CONFIGURATION_PID, props.configurationPid ?? props.name, modifiedConstructor);

    if (props.property) {
      Reflect.defineMetadata(COMPONENT_KEY_PROPERTY, props.property, modifiedConstructor);
    }

    Reflect.defineMetadata(
      COMPONENT_KEY_CONFIGURATION_POLICY,
      props.configurationPolicy ?? 'OPTIONAL',
      modifiedConstructor,
    );

    return modifiedConstructor as unknown as T;
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-field.injection
 *
 * @param {ReferenceProps} props
 * @constructor
 */
export function Reference(props: ReferenceProps) {
  return function (target: any, key: string | symbol) {
    Reflect.defineMetadata(REFERENCE_KEY_SERVICE, props.service, target, key);
    Reflect.defineMetadata(REFERENCE_KEY_CARDINALITY, props.cardinality ? props.cardinality : 'OPTIONAL', target, key);

    let val = target[key];

    const getter = () => {
      return val;
    };
    const setter = (next: any) => {
      val = next;
    };

    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-activation
 *
 * @constructor
 */
export function Activate() {
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return original.apply(this, args);
    };

    Reflect.defineMetadata(COMPONENT_ACTIVATE_KEY_METHOD, key, target, key);

    return descriptor;
  };
}

/**
 * https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html#service.component-deactivation
 *
 * @constructor
 */
export function Deactivate() {
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return original.apply(this, args);
    };

    Reflect.defineMetadata(COMPONENT_DEACTIVATE_KEY_METHOD, key, target, key);

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
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return original.apply(this, args);
    };

    Reflect.defineMetadata(COMPONENT_MODIFIED_KEY_METHOD, key, target, key);

    return descriptor;
  };
}
