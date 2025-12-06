import { useCallback, useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { OSGiFramework, BundleEvent, ServiceEvent } from '@pandino/pandino';
import type { FrameworkEvent, DSMetadata } from '../types';
import { EVENT_LOG_MAX_ENTRIES } from '../constants';
import { calculateLayout } from '../utils/layout';
import {
  createBundleNode,
  createServiceNode,
  createContainmentEdge,
  createReferenceEdges,
} from '../utils/graph-builders';

/**
 * Custom hook to manage framework graph state
 */
export function useFrameworkGraph(framework: OSGiFramework | null) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [events, setEvents] = useState<FrameworkEvent[]>([]);

  const buildGraph = useCallback(() => {
    if (!framework) return;

    const context = framework.getBundleContext();
    const bundles = context.getBundles();

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const serviceNodeMap = new Map<number, Node>();

    // Create bundle and service nodes
    bundles.forEach((bundle) => {
      const bundleId = bundle.getBundleId();

      // Create bundle node
      newNodes.push(createBundleNode(bundle));

      // Create service nodes for this bundle
      const services = bundle.getRegisteredServices();
      services.forEach((serviceRef) => {
        const serviceId = serviceRef.getProperty('service.id');
        const serviceNode = createServiceNode(framework, serviceRef, serviceId);

        newNodes.push(serviceNode);
        serviceNodeMap.set(serviceId, serviceNode);

        // Create containment edge
        newEdges.push(createContainmentEdge(bundleId, serviceId));

        // Create reference edges if this is a DS component
        const dsMetadata = serviceNode.data.dsMetadata as DSMetadata | null;
        if (dsMetadata?.references && dsMetadata.references.length > 0) {
          const referenceEdges = createReferenceEdges(
            serviceId,
            dsMetadata.references,
            serviceNodeMap,
            newNodes
          );
          newEdges.push(...referenceEdges);
        }
      });
    });

    // Apply automatic layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = calculateLayout(
      newNodes,
      newEdges,
      'TB'
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [framework]);

  // Listen to framework events
  useEffect(() => {
    if (!framework) return;

    const serviceListener = (event: ServiceEvent) => {
      setEvents((prev) =>
        [
          {
            type: 'service' as const,
            event,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, EVENT_LOG_MAX_ENTRIES)
      );
      buildGraph();
    };

    const bundleListener = (event: BundleEvent) => {
      setEvents((prev) =>
        [
          {
            type: 'bundle' as const,
            event,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, EVENT_LOG_MAX_ENTRIES)
      );
      buildGraph();
    };

    if (framework.on) {
      framework.on('service-event', serviceListener);
      framework.on('bundle-event', bundleListener);
    }

    // Initial build
    buildGraph();

    return () => {
      // Cleanup if needed
    };
  }, [framework, buildGraph]);

  return { nodes, edges, events };
}

