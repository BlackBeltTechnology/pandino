import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { OSGiFramework, BundleEvent, ServiceEvent } from '@pandino/pandino';
import { BUNDLE_STATES, getDecoratorInfo } from '@pandino/pandino';
import { BundleNode } from './nodes/BundleNode';
import { ServiceNode } from './nodes/ServiceNode';
import { StatisticsPanel } from './StatisticsPanel';
import { EventLog } from './EventLog';
import './PandinoVisualizer.css';

// Layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 150;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export interface PandinoVisualizerProps {
  framework: OSGiFramework;
  defaultOpen?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'fullscreen';
  children?: ReactNode;
}

interface FrameworkEvent {
  type: 'service' | 'bundle';
  event: ServiceEvent | BundleEvent;
  timestamp: number;
}

const nodeTypes = {
  bundle: BundleNode,
  service: ServiceNode,
};

export function PandinoVisualizer({
  framework,
  defaultOpen = false,
  position = 'fullscreen',
  children
}: PandinoVisualizerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [events, setEvents] = useState<FrameworkEvent[]>([]);
  const [selectedView, setSelectedView] = useState<'graph' | 'list'>('graph');

  // Build graph from framework state
  const buildGraph = useCallback(() => {
    if (!framework) return;

    const context = framework.getBundleContext();
    const bundles = context.getBundles();

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const serviceNodeMap = new Map<number, Node>();

    // Create bundle nodes
    bundles.forEach((bundle, index) => {
      const bundleId = bundle.getBundleId();
      const state = bundle.getState();
      const stateName = getStateName(state);

      newNodes.push({
        id: `bundle-${bundleId}`,
        type: 'bundle',
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        data: {
          bundle,
          label: bundle.getSymbolicName(),
          version: bundle.getVersion(),
          state: stateName,
          id: bundleId,
        },
      });

      // Create service nodes for this bundle
      const services = bundle.getRegisteredServices();
      services.forEach((serviceRef, serviceIndex) => {
        const serviceId = serviceRef.getProperty('service.id');
        const objectClass = serviceRef.getProperty('objectClass');
        const serviceName = Array.isArray(objectClass) ? objectClass[0] : objectClass;
        const ranking = serviceRef.getProperty('service.ranking') || 0;

        // Try to get the actual service instance to extract decorator metadata
        const context = framework.getBundleContext();
        let dsMetadata: any = null;

        try {
          const serviceInstance = context.getService(serviceRef);
          if (serviceInstance) {
            // Use framework's reflection utilities to extract decorator metadata
            const decoratorInfo = getDecoratorInfo(serviceInstance);

            if (decoratorInfo.component.isComponent) {
              dsMetadata = {
                isComponent: true,
                componentName: decoratorInfo.component.name,
                componentId: serviceId, // Use service ID as component ID
                factory: decoratorInfo.component.factory.isFactory ? decoratorInfo.component.factory.id : undefined,
                immediate: decoratorInfo.component.immediate,
                configurationPolicy: decoratorInfo.configuration.policy,
                configurationPid: decoratorInfo.configuration.pid,
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
        } catch (error) {
          // If we can't get the service instance, fall back to checking service properties
          // (for backwards compatibility with manually registered services)
          const componentName = serviceRef.getProperty('component.name');
          const componentId = serviceRef.getProperty('component.id');

          if (componentName || componentId) {
            dsMetadata = {
              isComponent: true,
              componentName: componentName,
              componentId: componentId,
              factory: serviceRef.getProperty('component.factory'),
              immediate: serviceRef.getProperty('component.immediate'),
              configurationPolicy: serviceRef.getProperty('component.configuration.policy'),
              configurationPid: serviceRef.getProperty('component.configuration.pid'),
              references: [],
            };

            // Extract reference information from properties
            const refKeys = Object.keys(serviceRef.getProperties()).filter(k =>
              k.startsWith('component.reference.') &&
              !k.includes('.interface') &&
              !k.includes('.cardinality') &&
              !k.includes('.policy') &&
              !k.includes('.target')
            );

            dsMetadata.references = refKeys.map(key => {
              const refName = key.replace('component.reference.', '');
              return {
                name: refName,
                interface: serviceRef.getProperty(`${key}.interface`),
                cardinality: serviceRef.getProperty(`${key}.cardinality`),
                policy: serviceRef.getProperty(`${key}.policy`),
                target: serviceRef.getProperty(`${key}.target`),
              };
            });
          }
        }

        const serviceNode: Node = {
          id: `service-${serviceId}`,
          type: 'service',
          position: { x: 0, y: 0 }, // Will be set by layout algorithm
          data: {
            serviceRef,
            label: serviceName,
            id: serviceId,
            ranking,
            properties: serviceRef.getProperties(),
            interfaces: Array.isArray(objectClass) ? objectClass : [objectClass],
            dsMetadata: dsMetadata,
          },
        };

        newNodes.push(serviceNode);
        serviceNodeMap.set(serviceId, serviceNode);

        // Create edge from bundle to service (containment)
        newEdges.push({
          id: `bundle-${bundleId}-service-${serviceId}`,
          source: `bundle-${bundleId}`,
          target: `service-${serviceId}`,
          type: 'straight',  // Straight line for containment
          animated: false,
          style: {
            stroke: '#4a4a4a',  // Gray for containment
            strokeWidth: 1.5,
            opacity: 0.5
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#4a4a4a',
          },
        });

        // Create edges for DS service references
        if (dsMetadata && dsMetadata.references && dsMetadata.references.length > 0) {
          dsMetadata.references.forEach((ref: any) => {
            // Find target service nodes that match the interface
            let referenceFound = false;
            serviceNodeMap.forEach((targetNode, targetServiceId) => {
              const targetInterfaces: string[] = (targetNode.data.interfaces as string[]) || [];
              if (targetInterfaces.includes(ref.interface)) {
                referenceFound = true;
                // Build label with reference details
                const cardinality = ref.cardinality || '1..1';
                const policy = ref.policy || 'static';
                const labelText = `${ref.name}\n[${cardinality}] ${policy}`;

                // Active reference - solid line
                newEdges.push({
                  id: `service-${serviceId}-ref-${targetServiceId}`,
                  source: `service-${serviceId}`,
                  target: `service-${targetServiceId}`,
                  type: 'smoothstep',
                  animated: policy === 'dynamic',
                  style: {
                    stroke: policy === 'dynamic' ? '#e91e63' : '#9c27b0',  // Pink for dynamic, purple for static
                    strokeWidth: 3,
                    strokeDasharray: '0'  // Solid line for active references
                  },
                  label: labelText,
                  labelStyle: {
                    fill: policy === 'dynamic' ? '#e91e63' : '#9c27b0',
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: 'monospace'
                  },
                  labelBgStyle: {
                    fill: '#ffffff',
                    fillOpacity: 0.95
                  },
                  labelBgPadding: [8, 5] as [number, number],
                  labelBgBorderRadius: 6,
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: policy === 'dynamic' ? '#e91e63' : '#9c27b0',
                  },
                });
              }
            });

            // If reference not found, create a broken reference indicator
            if (!referenceFound) {
              const cardinality = ref.cardinality || '1..1';
              const policy = ref.policy || 'static';
              const isMandatory = cardinality.startsWith('1');
              const labelText = `${ref.name}\n[${cardinality}] ${policy}\n⚠️ MISSING`;

              // Create a phantom node for the missing service
              const phantomNodeId = `phantom-${ref.interface}-${serviceId}`;
              if (!newNodes.find(n => n.id === phantomNodeId)) {
                newNodes.push({
                  id: phantomNodeId,
                  type: 'service',
                  position: { x: 0, y: 0 },
                  data: {
                    label: ref.interface,
                    id: -1,
                    ranking: 0,
                    properties: {},
                    interfaces: [ref.interface],
                    isMissing: true,
                  },
                });
              }

              // Broken reference - dashed line with warning color
              newEdges.push({
                id: `service-${serviceId}-ref-broken-${ref.name}`,
                source: `service-${serviceId}`,
                target: phantomNodeId,
                type: 'smoothstep',
                animated: false,
                style: {
                  stroke: isMandatory ? '#f44336' : '#ff9800',  // Red for mandatory, orange for optional
                  strokeWidth: 3,
                  strokeDasharray: '8,4'  // Dashed for broken/inactive
                },
                label: labelText,
                labelStyle: {
                  fill: isMandatory ? '#f44336' : '#ff9800',
                  fontWeight: 700,
                  fontSize: 12,
                  fontFamily: 'monospace'
                },
                labelBgStyle: {
                  fill: '#fff3e0',
                  fillOpacity: 0.95
                },
                labelBgPadding: [8, 5] as [number, number],
                labelBgBorderRadius: 6,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: isMandatory ? '#f44336' : '#ff9800',
                },
              });
            }
          });
        }
      });
    });

    // Apply automatic layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'TB');

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [framework, setNodes, setEdges]);

  // Listen to framework events
  useEffect(() => {
    if (!framework) return;

    const serviceListener = (event: ServiceEvent) => {
      setEvents(prev => [{
        type: 'service' as const,
        event,
        timestamp: Date.now()
      }, ...prev].slice(0, 100));
      buildGraph();
    };

    const bundleListener = (event: BundleEvent) => {
      setEvents(prev => [{
        type: 'bundle' as const,
        event,
        timestamp: Date.now()
      }, ...prev].slice(0, 100));
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

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!framework) return { totalBundles: 0, activeBundles: 0, totalServices: 0 };

    const context = framework.getBundleContext();
    const bundles = context.getBundles();
    const activeBundles = bundles.filter(b => b.getState() === BUNDLE_STATES.ACTIVE).length;

    let totalServices = 0;
    bundles.forEach(bundle => {
      totalServices += bundle.getRegisteredServices().length;
    });

    return {
      totalBundles: bundles.length,
      activeBundles,
      totalServices,
    };
  }, [framework, nodes]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className="pandino-visualizer-toggle"
        title="Open Pandino Visualizer (Ctrl+Shift+V)"
      >
        🔍
      </button>
    );
  }

  const containerClass = position === 'fullscreen'
    ? 'pandino-visualizer-fullscreen'
    : `pandino-visualizer-panel pandino-visualizer-${position}`;

  return (
    <div className={containerClass}>
      <div className="pandino-visualizer-header">
        <h2>🔍 Pandino Visualizer</h2>

        <StatisticsPanel statistics={statistics}>
          {children}
        </StatisticsPanel>

        <div className="pandino-visualizer-controls">
          <button
            onClick={() => setSelectedView('graph')}
            className={selectedView === 'graph' ? 'active' : ''}
          >
            Graph View
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={selectedView === 'list' ? 'active' : ''}
          >
            List View
          </button>
          <button onClick={handleToggle} className="pandino-visualizer-close">
            ×
          </button>
        </div>
      </div>


      {selectedView === 'graph' ? (
        <div className="pandino-visualizer-graph">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes as any}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'bundle') {
                  const state = node.data.state;
                  if (state === 'ACTIVE') return '#4caf50';
                  if (state === 'RESOLVED') return '#2196f3';
                  return '#ff9800';
                }
                return '#9c27b0';
              }}
            />
            <Panel position="bottom-right">
              <div className="pandino-legend">
                <div className="legend-section">
                  <div className="legend-section-title">Nodes</div>
                  <div><span className="legend-color bundle-active"></span> Active Bundle</div>
                  <div><span className="legend-color bundle-resolved"></span> Resolved Bundle</div>
                  <div><span className="legend-color service"></span> Service</div>
                  <div><span className="legend-color ds-component"></span> DS Component</div>
                  <div><span className="legend-color missing-service"></span> Missing Service</div>
                </div>
                <div className="legend-section">
                  <div className="legend-section-title">Edges</div>
                  <div><span className="legend-line containment"></span> Bundle Contains</div>
                  <div><span className="legend-line ds-reference-active"></span> Active Reference</div>
                  <div><span className="legend-line ds-reference-broken"></span> Broken Reference</div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      ) : (
        <EventLog events={events} framework={framework} />
      )}
    </div>
  );
}

function getStateName(state: number): string {
  for (const [name, value] of Object.entries(BUNDLE_STATES)) {
    if (value === state) return name;
  }
  return 'UNKNOWN';
}

