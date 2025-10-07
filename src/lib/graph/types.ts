import type { XYPosition, Edge, Node as FlowNode } from "@xyflow/react";

export interface GraphNodeStyle {
  fontWidth: number;
  padding: number;
  borderWidth: number;
  kvGap: number;
  maxKeyWidth: number;
  maxValueWidth: number;
  kvHeight: number;
  nodeGap: number; // spacing between neighboring nodes at the same level (in px)
  levelGap: number; // spacing between neighboring levels (in px)
}

export type NodeWithData = FlowNode<{
  parentId: string;
  targetIds: string[];
  level: number; // distance from root node
  depth: number; // max distance from leaf node
  width: number; // The width of the node in pixels
  height: number; // The height of the node in pixels
  kvWidthMap: Record<string, [number, number]>; // child key-value pair width map. type is {key: [keyWidth, valueWidth]}
  render: NodeRender; // The rendering configuration of the node
  toolbarVisible?: boolean; // Whether the node's toolbar is visible
  style?: React.CSSProperties; // Custom CSS styles for the node
  selected?: boolean; // Whether the node is selected
  selectedKvId?: string; // Tree node id of the selected key-value pair in the graph node
}>;

interface NodeRender {
  kvStart: number;
  kvEnd: number;
  virtualHandleIndices: Record<number, boolean>;
}

export type EdgeWithData = Edge<{
  sourceHandleIndex: number; // the source handle index in the source node.
  targetHandleOffset: number; // the distance from the edge's ending point to the top of the target node.
  start: XYPosition; // the starting point of the edge, equals (source.x + source.width, source.y + sourceOffset)
  end: XYPosition; // the ending point of the edge, equals (target.x, target.y + targetOffset)
  style?: React.CSSProperties;
}>;

export interface GraphVirtual {
  /**
   * A map of node IDs that are currently within the viewport.
   * The key is the node ID, and the value is true.
   */
  realNodeIds: Record<string, boolean>;
  /**
   * A map of edge IDs that are currently within the viewport.
   * The key is the edge ID, and the value is true.
   */
  realEdgeIds: Record<string, boolean>;
  /**
   * A map of edge IDs that should be omitted from rendering for performance reasons,
   * typically when both source and target nodes are off-screen.
   * The key is the edge ID, and the value is true.
   */
  omitEdgeIds?: Record<string, boolean>;
  /**
   * A map of node IDs for which a virtual source node should be created.
   * This happens when a visible edge's source node is outside the viewport.
   * The key is the node ID, and the value is true.
   */
  virtualSourceNodeIds?: Record<string, boolean>;
  /**
   * A map of node IDs for which a virtual target node should be created.
   * This happens when a visible edge's target node is outside the viewport.
   * The key is the node ID, and the value is true.
   */
  virtualTargetNodeIds?: Record<string, boolean>;
}

export interface Graph {
  __type: "graph";
  /**
   * An array containing all the nodes in the entire graph, including those not currently visible.
   */
  nodes: NodeWithData[];
  /**
   * An array containing all the edges in the entire graph, including those not currently visible.
   */
  edges: EdgeWithData[];
  /**
   * Metadata for each level of the graph, used during layout calculation.
   * Stores information like the maximum x and y coordinates for each level.
   */
  levelMeta?: XYPosition[];
  /**
   * A map from node ID to the corresponding NodeWithData object for quick lookups.
   * Contains all nodes in the graph.
   */
  nodeMap?: Record<string, NodeWithData>;
  /**
   * A map from edge ID to the corresponding EdgeWithData object for quick lookups.
   * Contains all edges in the graph.
   */
  edgeMap?: Record<string, EdgeWithData>;
  /**
   * Contains the state of the graph virtualization, including which nodes and edges are visible,
   * which are virtual, and which are omitted.
   */
  virtual?: GraphVirtual;
}

export interface SubGraph {
  __type: "subGraph";
  nodes: NodeWithData[];
  edges: EdgeWithData[];
}

// The type of the UI element to be revealed, specifying *what* to highlight or focus on.
// This is distinct from `NodeType`, which describes the underlying JSON data type (e.g., object, string).
export type RevealTarget = "graphNode" | "keyValue" | "key" | "value";
export type RevealFrom =
  | "editor"
  | "statusBar"
  | "search"
  | "graph" // don't need reveal to the position (see `useRevealNode` for details)
  | "graphClick" // don't need reveal to the position
  | "graphDoubleClick" // need reveal to the position
  | "graphButton"; // need reveal to the position

/**
 * Represents a request to reveal a specific element in the UI.
 * This object is used as an event to coordinate actions between different components (e.g., editor, graph).
 * It contains all the information needed to fulfill the reveal request, such as the target node and the source of the action.
 */
export interface RevealPosition {
  version: number; // version is used to re-trigger when assigned same id by caller
  target: RevealTarget;
  from: RevealFrom;
  treeNodeId: string;
}
