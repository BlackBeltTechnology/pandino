import { describe, it, expect } from 'vitest';
import { SERVICE_RANKING } from '@pandino/pandino-api';
import { DOES_STUFF_INTERFACE_KEY, Host } from './__fixtures__/hostAndGuest';
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

describe('Decorators', () => {
  it('@Component', () => {
    expect(Reflect.getMetadata(COMPONENT_KEY_NAME, Host)).toEqual('@test/Host');
    expect(Reflect.getMetadata(COMPONENT_KEY_SERVICE, Host)).toEqual('@test/Host');
    expect(Reflect.getMetadata(COMPONENT_KEY_CONFIGURATION_PID, Host)).toEqual('@test/Host');
    expect(Reflect.getMetadata(COMPONENT_KEY_CONFIGURATION_POLICY, Host)).toEqual('OPTIONAL');
    expect(Reflect.getMetadata(COMPONENT_KEY_PROPERTY, Host)).toEqual({ [SERVICE_RANKING]: 10 });

    expect(Reflect.getMetadataKeys(Host.prototype, 'test')).toEqual([]);
  });

  it('@Activate', () => {
    expect(Reflect.getMetadataKeys(Host.prototype, 'onActivate')).toEqual([COMPONENT_ACTIVATE_KEY_METHOD]);
  });

  it('@Deactivate', () => {
    expect(Reflect.getMetadataKeys(Host.prototype, 'onDeactivate')).toEqual([COMPONENT_DEACTIVATE_KEY_METHOD]);
  });

  it('@Modified', () => {
    expect(Reflect.getMetadataKeys(Host.prototype, 'onModified')).toEqual([COMPONENT_MODIFIED_KEY_METHOD]);
  });

  it('@Reference', () => {
    const fieldsWithReference: string[] = Object.keys(Host.prototype).filter((k) =>
      Reflect.getMetadataKeys(Host.prototype, k).some((k) => k.startsWith('pandino:scr:Reference.')),
    );

    expect(fieldsWithReference.length).toEqual(1);
    expect(fieldsWithReference[0]).toEqual('guest');
    expect(Reflect.getMetadata(REFERENCE_KEY_SERVICE, Host.prototype, 'guest')).toEqual(DOES_STUFF_INTERFACE_KEY);
    expect(Reflect.getMetadata(REFERENCE_KEY_CARDINALITY, Host.prototype, 'guest')).toEqual('MANDATORY');
  });
});
