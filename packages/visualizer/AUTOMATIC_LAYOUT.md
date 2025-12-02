# Automatic Graph Layout - Dagre Integration

## ✅ Feature Added

The Pandino Visualizer now uses **Dagre** (Directed Acyclic Graph layout algorithm) to automatically position nodes without overlaps!

## 🎯 What Changed

### 1. **Added Dagre Dependency**
```json
"dependencies": {
  "@xyflow/react": "^12.3.2",
  "dagre": "^0.8.5"  // ← New!
}
```

### 2. **Automatic Layout Function**
```typescript
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: direction,  // TB = Top to Bottom, LR = Left to Right
    ranksep: 100,        // Vertical spacing between ranks
    nodesep: 80          // Horizontal spacing between nodes
  });

  // Add nodes and edges to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Compute layout
  dagre.layout(dagreGraph);

  // Apply calculated positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
```

### 3. **Updated buildGraph Function**
**Before:**
```typescript
// Manual grid positioning
newNodes.push({
  id: `bundle-${bundleId}`,
  type: 'bundle',
  position: {
    x: 100 + (index % 3) * 300,
    y: 100 + Math.floor(index / 3) * 250
  },
  // ...
});
```

**After:**
```typescript
// Temporary position (will be calculated)
newNodes.push({
  id: `bundle-${bundleId}`,
  type: 'bundle',
  position: { x: 0, y: 0 }, // Will be set by layout algorithm
  // ...
});

// Apply automatic layout
const { nodes: layoutedNodes, edges: layoutedEdges } =
  getLayoutedElements(newNodes, newEdges, 'TB');

setNodes(layoutedNodes);
setEdges(layoutedEdges);
```

## 🎨 Layout Configuration

### Current Settings
- **Direction**: `TB` (Top to Bottom) - bundles on top, services below
- **Rank Separation**: `100px` - vertical spacing between layers
- **Node Separation**: `80px` - horizontal spacing between nodes
- **Node Size**: `220x150px`

### Customizable Options
You can change the direction to horizontal layout:
```typescript
getLayoutedElements(newNodes, newEdges, 'LR'); // Left to Right
```

## 📊 Before vs After

### Before (Manual Grid):
```
[Bundle 0]  [Bundle 1]  [Bundle 2]
  ↓           ↓           ↓
[Service 0] [Service 1] [Service 2]  ← Could overlap!
[Service 0] [Service 2]              ← Irregular spacing
```

### After (Dagre Layout):
```
         [Bundle 0]
            ↓
      [Service 0]  [Service 1]
            ↓
         [Bundle 1]              ← Intelligent hierarchy
            ↓
      [Service 2]
```

## ✨ Benefits

1. **No Overlaps** - Dagre ensures nodes never overlap
2. **Hierarchical Layout** - Bundles and their services are properly organized
3. **Automatic Spacing** - Optimal spacing between nodes
4. **Scalable** - Works with any number of bundles/services
5. **Professional Look** - Clean, organized graph structure

## 🔧 Technical Details

### Algorithm
- **Dagre**: Hierarchical layout algorithm for directed graphs
- **Complexity**: O(V + E) where V = nodes, E = edges
- **Method**: Ranks nodes by dependency depth, then minimizes edge crossings

### Node Positioning
1. Nodes start at position (0, 0)
2. Dagre calculates optimal positions based on:
   - Edge directions (bundle → service)
   - Node dimensions (220x150)
   - Separation constraints (ranksep, nodesep)
3. Positions are applied with centering offset

### Edge Handling
- **Type**: `smoothstep` - curved edges that avoid nodes
- **Animation**: Active bundles have animated edges
- **Arrows**: Directional markers show bundle → service relationship

## 📦 Bundle Size Impact

**Before:** 671 KB (211 KB gzipped)
**After:** 764 KB (244 KB gzipped)
**Increase:** +93 KB (+33 KB gzipped)

The Dagre library adds ~93KB to the bundle, but provides professional automatic layout that's worth the trade-off for complex graphs.

## 🎯 Result

The visualizer now automatically arranges all bundles and services in a clean, hierarchical layout with guaranteed no overlaps! The graph is much more readable, especially with many bundles and services.

## 🔄 Future Enhancements

Possible improvements:
- Add layout direction toggle (TB/LR/BT/RL)
- Adjustable spacing settings in UI
- Different layout algorithms (force-directed, circular, etc.)
- Save/restore manual node positions
- Animated transitions between layouts

