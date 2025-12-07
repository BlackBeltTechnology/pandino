import type { OSGiFramework, ServiceReference } from '@pandino/pandino';
import { getDecoratorInfo } from '@pandino/pandino';
import type { DSMetadata } from '../types';

/**
 * Extract DS metadata from a service reference
 */
export function extractDSMetadata(
  framework: OSGiFramework,
  serviceRef: ServiceReference<any>,
  serviceId: number
): DSMetadata | null {
  const context = framework.getBundleContext();

  // Try to get the actual service instance to extract decorator metadata
  try {
    const serviceInstance = context.getService(serviceRef);
    if (serviceInstance) {
      const decoratorInfo = getDecoratorInfo(serviceInstance);

      if (decoratorInfo.component.isComponent) {
        return {
          isComponent: true,
          componentName: decoratorInfo.component.name || undefined,
          componentId: serviceId,

          // Component properties
          properties: decoratorInfo.configuration.properties,

          // Service registration
          service: decoratorInfo.service.interfaces.length > 0 ? {
            interfaces: decoratorInfo.service.interfaces,
            scope: decoratorInfo.service.scope || undefined,
          } : undefined,

          // Lifecycle methods
          activate: decoratorInfo.lifecycle.activate || undefined,
          deactivate: decoratorInfo.lifecycle.deactivate || undefined,
          modified: decoratorInfo.lifecycle.modified || undefined,

          // Configuration
          configurationPid: decoratorInfo.configuration.pid || undefined,
          configurationPolicy: decoratorInfo.configuration.policy,

          // Factory support
          factory: decoratorInfo.component.factory.isFactory
            ? decoratorInfo.component.factory.id || undefined
            : undefined,

          // Component behavior
          immediate: decoratorInfo.component.immediate,
          enabled: decoratorInfo.component.enabled,
          scope: decoratorInfo.rawMetadata?.scope,

          // References - map complete ReferenceDescriptor
          references: decoratorInfo.references.map((ref) => ({
            name: ref.name,
            interface: ref.interface,
            cardinality: ref.cardinality,
            policy: ref.policy,
            policyOption: ref.policyOption,
            target: ref.target,
            bind: ref.bind,
            unbind: ref.unbind,
            updated: ref.updated,
            field: ref.field,
            fieldOption: ref.fieldOption,
            scope: ref.scope,
          })),
        };
      }
    }
  } catch {
    // Fall back to checking service properties
    return extractDSMetadataFromProperties(serviceRef);
  }

  return null;
}

/**
 * Extract DS metadata from service properties (fallback)
 */
function extractDSMetadataFromProperties(
  serviceRef: ServiceReference<any>
): DSMetadata | null {
  const componentName = serviceRef.getProperty('component.name');
  const componentId = serviceRef.getProperty('component.id');

  if (!componentName && !componentId) {
    return null;
  }

  const properties = serviceRef.getProperties();
  const refKeys = Object.keys(properties).filter(
    (k) =>
      k.startsWith('component.reference.') &&
      !k.includes('.interface') &&
      !k.includes('.cardinality') &&
      !k.includes('.policy') &&
      !k.includes('.target') &&
      !k.includes('.policyOption') &&
      !k.includes('.bind') &&
      !k.includes('.unbind') &&
      !k.includes('.updated') &&
      !k.includes('.field') &&
      !k.includes('.fieldOption') &&
      !k.includes('.scope')
  );

  const references = refKeys.map((key) => {
    const refName = key.replace('component.reference.', '');
    return {
      name: refName,
      interface: serviceRef.getProperty(`${key}.interface`) || 'any',
      cardinality: serviceRef.getProperty(`${key}.cardinality`) || '1..1',
      policy: serviceRef.getProperty(`${key}.policy`) || 'static',
      policyOption: serviceRef.getProperty(`${key}.policyOption`),
      target: serviceRef.getProperty(`${key}.target`),
      bind: serviceRef.getProperty(`${key}.bind`),
      unbind: serviceRef.getProperty(`${key}.unbind`),
      updated: serviceRef.getProperty(`${key}.updated`),
      field: serviceRef.getProperty(`${key}.field`),
      fieldOption: serviceRef.getProperty(`${key}.fieldOption`),
      scope: serviceRef.getProperty(`${key}.scope`),
    };
  });

  // Extract service interfaces
  const objectClass = serviceRef.getProperty('objectClass');
  const interfaces = Array.isArray(objectClass) ? objectClass : [objectClass];

  return {
    isComponent: true,
    componentName,
    componentId,

    properties: {},

    service: {
      interfaces,
      scope: serviceRef.getProperty('service.scope'),
    },

    activate: serviceRef.getProperty('component.activate'),
    deactivate: serviceRef.getProperty('component.deactivate'),
    modified: serviceRef.getProperty('component.modified'),

    factory: serviceRef.getProperty('component.factory'),
    immediate: serviceRef.getProperty('component.immediate'),
    enabled: serviceRef.getProperty('component.enabled'),
    scope: serviceRef.getProperty('component.scope'),

    configurationPolicy: serviceRef.getProperty('component.configuration.policy') || 'optional',
    configurationPid: serviceRef.getProperty('component.configuration.pid'),

    references,
  };
}

/**
 * Get bundle state name from state number
 */
export function getStateName(state: number, stateMap: Record<string, number>): string {
  for (const [name, value] of Object.entries(stateMap)) {
    if (value === state) return name;
  }
  return 'UNKNOWN';
}

