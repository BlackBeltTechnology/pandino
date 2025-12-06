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
          factory: decoratorInfo.component.factory.isFactory
            ? decoratorInfo.component.factory.id || undefined
            : undefined,
          immediate: decoratorInfo.component.immediate,
          configurationPolicy: decoratorInfo.configuration.policy,
          configurationPid: decoratorInfo.configuration.pid || undefined,
          references: decoratorInfo.references.map((ref: any) => ({
            name: ref.name,
            interface: ref.interface,
            cardinality: ref.cardinality,
            policy: ref.policy,
            target: ref.target,
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
      !k.includes('.target')
  );

  const references = refKeys.map((key) => {
    const refName = key.replace('component.reference.', '');
    return {
      name: refName,
      interface: serviceRef.getProperty(`${key}.interface`),
      cardinality: serviceRef.getProperty(`${key}.cardinality`),
      policy: serviceRef.getProperty(`${key}.policy`),
      target: serviceRef.getProperty(`${key}.target`),
    };
  });

  return {
    isComponent: true,
    componentName,
    componentId,
    factory: serviceRef.getProperty('component.factory'),
    immediate: serviceRef.getProperty('component.immediate'),
    configurationPolicy: serviceRef.getProperty('component.configuration.policy'),
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

