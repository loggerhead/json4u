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
  width: number;
  height: number;
  render: NodeRender;
  toolbarVisible?: boolean;
  style?: React.CSSProperties;
  selected?: boolean;
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
  realNodeIds: Record<string, boolean>;
  realEdgeIds: Record<string, boolean>;
  omitEdgeIds?: Record<string, boolean>;
  virtualSourceNodeIds?: Record<string, boolean>;
  virtualTargetNodeIds?: Record<string, boolean>;
}

export interface Graph {
  nodes: NodeWithData[];
  edges: EdgeWithData[];
  levelMeta?: XYPosition[];
  nodeMap?: Record<string, NodeWithData>;
  edgeMap?: Record<string, EdgeWithData>;
  virtual?: GraphVirtual;
}

export type RevealType = "node" | "key" | "value";
export type RevealFrom = "editor" | "statusBar" | "search" | "graphAll" | "graphOthers";

export interface RevealPosition {
  version: number; // version is used to re-trigger when assigned same id by caller
  type: RevealType;
  from: RevealFrom;
  treeNodeId: string;
}
