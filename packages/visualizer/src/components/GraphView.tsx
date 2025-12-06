import React, { memo, createElement } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BundleNode } from './nodes/BundleNode';
import { ServiceNode } from './nodes/ServiceNode';
import { NODE_COLORS } from '../constants';

const nodeTypes = {
  bundle: BundleNode,
  service: ServiceNode,
};

export interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
}

export const GraphView = memo(({ nodes, edges }: GraphViewProps) => {
  const [displayNodes, setDisplayNodes, onNodesChange] = useNodesState(nodes);
  const [displayEdges, setDisplayEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when props change
  React.useEffect(() => {
    setDisplayNodes(nodes);
  }, [nodes, setDisplayNodes]);

  React.useEffect(() => {
    setDisplayEdges(edges);
  }, [edges, setDisplayEdges]);

  return (
    <div className="pandino-visualizer-graph">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes as any}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        {createElement(Background as any, { variant: BackgroundVariant.Dots, gap: 12, size: 1 })}
        {createElement(Controls as any)}
        {createElement(MiniMap as any, {
          nodeColor: (node: Node) => {
            if (node.type === 'bundle') {
              const state = node.data.state;
              if (state === 'ACTIVE') return NODE_COLORS.BUNDLE_ACTIVE;
              if (state === 'RESOLVED') return NODE_COLORS.BUNDLE_RESOLVED;
              return NODE_COLORS.BUNDLE_OTHER;
            }
            return NODE_COLORS.SERVICE;
          },
        })}
      </ReactFlow>
    </div>
  );
});

GraphView.displayName = 'GraphView';

