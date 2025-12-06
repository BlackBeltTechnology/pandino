import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { Bundle, OSGiFramework } from '@pandino/pandino';
import { BUNDLE_STATES } from '@pandino/pandino';
import { EDGE_STYLES } from '../constants';
import { extractDSMetadata, getStateName } from './metadata';
import type { ServiceNodeMap, DSReference } from '../types';

/**
 * Create a bundle node
 */
export function createBundleNode(bundle: Bundle): Node {
  const bundleId = bundle.getBundleId();
  const state = bundle.getState();
  const stateName = getStateName(state, BUNDLE_STATES);

  return {
    id: `bundle-${bundleId}`,
    type: 'bundle',
    position: { x: 0, y: 0 },
    data: {
      bundle,
      label: bundle.getSymbolicName(),
      version: bundle.getVersion(),
      state: stateName,
      id: bundleId,
    },
  };
}

/**
 * Create a service node
 */
export function createServiceNode(
  framework: OSGiFramework,
  serviceRef: any,
  serviceId: number
): Node {
  const objectClass = serviceRef.getProperty('objectClass');
  const serviceName = Array.isArray(objectClass) ? objectClass[0] : objectClass;
  const ranking = serviceRef.getProperty('service.ranking') || 0;
  const dsMetadata = extractDSMetadata(framework, serviceRef, serviceId);

  return {
    id: `service-${serviceId}`,
    type: 'service',
    position: { x: 0, y: 0 },
    data: {
      serviceRef,
      label: serviceName,
      id: serviceId,
      ranking,
      properties: serviceRef.getProperties(),
      interfaces: Array.isArray(objectClass) ? objectClass : [objectClass],
      dsMetadata,
    },
  };
}

/**
 * Create a phantom node for missing service
 */
export function createPhantomNode(interfaceName: string, sourceServiceId: number): Node {
  return {
    id: `phantom-${interfaceName}-${sourceServiceId}`,
    type: 'service',
    position: { x: 0, y: 0 },
    data: {
      label: interfaceName,
      id: -1,
      ranking: 0,
      properties: {},
      interfaces: [interfaceName],
      isMissing: true,
    },
  };
}

/**
 * Create a containment edge (bundle -> service)
 */
export function createContainmentEdge(bundleId: number, serviceId: number): Edge {
  return {
    id: `bundle-${bundleId}-service-${serviceId}`,
    source: `bundle-${bundleId}`,
    target: `service-${serviceId}`,
    type: 'straight',
    animated: false,
    style: EDGE_STYLES.CONTAINMENT,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: EDGE_STYLES.CONTAINMENT.stroke,
    },
  };
}

/**
 * Create a working reference edge
 */
export function createWorkingReferenceEdge(
  sourceServiceId: number,
  targetServiceId: number,
  ref: DSReference
): Edge {
  const cardinality = ref.cardinality || '1..1';
  const policy = ref.policy || 'static';

  return {
    id: `service-${sourceServiceId}-ref-${targetServiceId}`,
    source: `service-${sourceServiceId}`,
    target: `service-${targetServiceId}`,
    type: 'smoothstep',
    animated: false,
    style: EDGE_STYLES.WORKING_REFERENCE,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: EDGE_STYLES.WORKING_REFERENCE.stroke,
      width: 12,
      height: 12,
    },
    data: {
      refName: ref.name,
      cardinality,
      policy,
      satisfied: true,
    },
  };
}

/**
 * Create a broken reference edge
 */
export function createBrokenReferenceEdge(
  sourceServiceId: number,
  phantomNodeId: string,
  ref: DSReference
): Edge {
  const cardinality = ref.cardinality || '1..1';
  const policy = ref.policy || 'static';
  const isMandatory = cardinality.startsWith('1');
  const edgeStyle = isMandatory ? EDGE_STYLES.BROKEN_MANDATORY : EDGE_STYLES.BROKEN_OPTIONAL;

  const labelText = `⚠️ ${ref.name}\n[${cardinality}] ${policy}\nMISSING: ${ref.interface}`;

  return {
    id: `service-${sourceServiceId}-ref-broken-${ref.name}`,
    source: `service-${sourceServiceId}`,
    target: phantomNodeId,
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: edgeStyle.stroke,
      strokeWidth: edgeStyle.strokeWidth,
      strokeDasharray: '10,5',
    },
    label: labelText,
    labelStyle: {
      fill: edgeStyle.stroke,
      fontWeight: 700,
      fontSize: 13,
      fontFamily: 'monospace',
    },
    labelBgStyle: {
      fill: isMandatory ? '#ffebee' : '#fff3e0',
      fillOpacity: 0.98,
      stroke: edgeStyle.stroke,
      strokeWidth: 1.5,
    },
    labelBgPadding: [10, 6] as [number, number],
    labelBgBorderRadius: 8,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyle.stroke,
      width: 20,
      height: 20,
    },
    data: {
      refName: ref.name,
      cardinality,
      policy,
      satisfied: false,
      isMandatory,
    },
  };
}

/**
 * Create a factory edge (factory service -> created service instance)
 */
export function createFactoryEdge(
  factoryServiceId: number,
  createdServiceId: number
): Edge {
  return {
    id: `factory-${factoryServiceId}-created-${createdServiceId}`,
    source: `service-${factoryServiceId}`,
    target: `service-${createdServiceId}`,
    type: 'smoothstep',
    animated: true,
    style: EDGE_STYLES.FACTORY_CREATED,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: EDGE_STYLES.FACTORY_CREATED.stroke,
      width: 14,
      height: 14,
    },
    data: {
      edgeType: 'factory',
    },
  };
}

/**
 * Create reference edges for a service
 * Returns edges and a flag indicating if there are missing required references
 */
export function createReferenceEdges(
  serviceId: number,
  references: DSReference[],
  serviceNodeMap: ServiceNodeMap,
  nodes: Node[]
): { edges: Edge[]; hasMissingRequiredRefs: boolean } {
  const edges: Edge[] = [];
  let hasMissingRequiredRefs = false;

  references.forEach((ref) => {
    let referenceFound = false;

    // Find target service nodes that match the interface
    serviceNodeMap.forEach((targetNode, targetServiceId) => {
      const targetInterfaces: string[] = (targetNode.data.interfaces as string[]) || [];
      if (targetInterfaces.includes(ref.interface || '')) {
        referenceFound = true;
        edges.push(createWorkingReferenceEdge(serviceId, targetServiceId, ref));
      }
    });

    // Create broken reference edge ONLY if not found AND it's mandatory (required)
    if (!referenceFound) {
      const cardinality = ref.cardinality || '1..1';

      // Parse lower bound from cardinality (e.g., "0..1" -> 0, "1..n" -> 1, "2..*" -> 2)
      const lowerBound = parseInt(cardinality.split('..')[0], 10);
      const isMandatory = !isNaN(lowerBound) && lowerBound >= 1;

      // Only show missing required references (skip optional ones with lower bound 0)
      if (isMandatory) {
        hasMissingRequiredRefs = true;
        const phantomNodeId = `phantom-${ref.interface}-${serviceId}`;

        // Create phantom node if it doesn't exist
        if (!nodes.find((n) => n.id === phantomNodeId)) {
          nodes.push(createPhantomNode(ref.interface || 'Unknown', serviceId));
        }

        edges.push(createBrokenReferenceEdge(serviceId, phantomNodeId, ref));
      }
    }
  });

  return { edges, hasMissingRequiredRefs };
}

