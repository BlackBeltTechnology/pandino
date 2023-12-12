import type { ServiceProperties } from '@pandino/pandino-api';
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
  REFERENCE_KEY_POLICY,
  REFERENCE_KEY_POLICY_OPTION,
  REFERENCE_KEY_SCOPE,
  REFERENCE_KEY_SERVICE,
  REFERENCE_KEY_TARGET,
} from './constants';
import type { ConfigurationPolicy, ReferenceCardinality, ReferencePolicy, ReferencePolicyOption, ReferenceScope } from './interfaces';

export interface InternalMetaData {
  [COMPONENT_KEY_NAME]: string;
  [COMPONENT_KEY_SERVICE]: string | string[];
  [COMPONENT_KEY_CONFIGURATION_PID]: string | string[];
  [COMPONENT_KEY_PROPERTY]: ServiceProperties;
  [COMPONENT_KEY_CONFIGURATION_POLICY]: ConfigurationPolicy;
  references: Record<string | symbol, InternalReferenceMetaData>;
  [COMPONENT_ACTIVATE_KEY_METHOD]?: InternalActivatorMetaData;
  [COMPONENT_DEACTIVATE_KEY_METHOD]?: InternalDeActivatorMetaData;
  [COMPONENT_MODIFIED_KEY_METHOD]?: InternalModifiedMetaData;
}

export interface InternalReferenceMetaData {
  [REFERENCE_KEY_SERVICE]: string;
  [REFERENCE_KEY_TARGET]?: string;
  [REFERENCE_KEY_CARDINALITY]: ReferenceCardinality;
  [REFERENCE_KEY_POLICY]: ReferencePolicy;
  [REFERENCE_KEY_POLICY_OPTION]: ReferencePolicyOption;
  [REFERENCE_KEY_SCOPE]: ReferenceScope;
}

export interface InternalActivatorMetaData {
  method: string | symbol;
}

export interface InternalDeActivatorMetaData {
  method: string | symbol;
}

export interface InternalModifiedMetaData {
  method: string | symbol;
}
