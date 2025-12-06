import dagre from 'dagre';
import type { Node, Edge, Position } from '@xyflow/react';
import { Position as PositionEnum } from '@xyflow/react';
import { LAYOUT_CONFIG } from '../constants';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

/**
 * Calculate automatic layout for nodes and edges using Dagre
 */
export function calculateLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === 'LR';

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: LAYOUT_CONFIG.RANK_SEP,
    nodesep: LAYOUT_CONFIG.NODE_SEP,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: LAYOUT_CONFIG.NODE_WIDTH,
      height: LAYOUT_CONFIG.NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: (isHorizontal ? PositionEnum.Left : PositionEnum.Top) as Position,
      sourcePosition: (isHorizontal ? PositionEnum.Right : PositionEnum.Bottom) as Position,
      position: {
        x: nodeWithPosition.x - LAYOUT_CONFIG.NODE_WIDTH / 2,
        y: nodeWithPosition.y - LAYOUT_CONFIG.NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

