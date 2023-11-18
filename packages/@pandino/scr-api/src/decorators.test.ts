import { describe, expect, it } from 'vitest';
import { SERVICE_RANKING } from '@pandino/pandino-api';
import { DOES_STUFF_INTERFACE_KEY, Host } from './__fixtures__/hostAndGuest';
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
  REFERENCE_KEY_CARDINALITY,
  REFERENCE_KEY_POLICY,
  REFERENCE_KEY_POLICY_OPTION,
  REFERENCE_KEY_SCOPE,
  REFERENCE_KEY_SERVICE,
} from './constants';
import type { InternalMetaData, InternalReferenceMetaData } from './internal-interfaces';

describe('Decorators', () => {
  it('@Component', () => {
    const classMetaData: InternalMetaData = Host.prototype[$$PANDINO_META];

    expect(classMetaData[COMPONENT_KEY_NAME]).toEqual('@test/Host');
    expect(classMetaData[COMPONENT_KEY_SERVICE]).toEqual('@test/Host');
    expect(classMetaData[COMPONENT_KEY_CONFIGURATION_PID]).toEqual('@test/Host');
    expect(classMetaData[COMPONENT_KEY_CONFIGURATION_POLICY]).toEqual('OPTIONAL');
    expect(classMetaData[COMPONENT_KEY_PROPERTY]).toEqual({ [SERVICE_RANKING]: 10 });
  });

  it('@Activate', () => {
    const classMetaData: InternalMetaData = Host.prototype[$$PANDINO_META];
    expect(classMetaData).toBeDefined();
    expect(classMetaData[COMPONENT_ACTIVATE_KEY_METHOD]).toEqual({ method: 'onActivate' });
  });

  it('@Deactivate', () => {
    const classMetaData: InternalMetaData = Host.prototype[$$PANDINO_META];
    expect(classMetaData).toBeDefined();
    expect(classMetaData[COMPONENT_DEACTIVATE_KEY_METHOD]).toEqual({ method: 'onDeactivate' });
  });

  it('@Modified', () => {
    const classMetaData: InternalMetaData = Host.prototype[$$PANDINO_META];
    expect(classMetaData).toBeDefined();
    expect(classMetaData[COMPONENT_MODIFIED_KEY_METHOD]).toEqual({ method: 'onModified' });
  });

  it('@Reference', () => {
    const classMetaData: InternalMetaData = Host.prototype[$$PANDINO_META];
    expect(classMetaData).toBeDefined();

    const guestMetaData: InternalReferenceMetaData = classMetaData.references['guest'];
    expect(guestMetaData).toBeDefined();
    expect(guestMetaData[REFERENCE_KEY_SERVICE]).toEqual(DOES_STUFF_INTERFACE_KEY);
    expect(guestMetaData[REFERENCE_KEY_CARDINALITY]).toEqual('MANDATORY');
    expect(guestMetaData[REFERENCE_KEY_POLICY]).toEqual('STATIC');
    expect(guestMetaData[REFERENCE_KEY_POLICY_OPTION]).toEqual('RELUCTANT');
    expect(guestMetaData[REFERENCE_KEY_SCOPE]).toEqual('BUNDLE');
  });

  it('instance info', () => {
    const host = new Host();
    expect(host).toBeDefined();
    expect(host[$$PANDINO_META]).toBeDefined();
    expect((host[$$PANDINO_META] as InternalMetaData)[COMPONENT_KEY_NAME]).toEqual('@test/Host');
  });

  it('instance info for symbol', () => {
    const host = new Host();
    expect(host).toBeDefined();
    expect(host[Symbol.for('$$PANDINO_SCR_META')]).toBeDefined();
  });
});
