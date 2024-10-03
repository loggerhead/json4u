import { type CSSProperties } from "react";
import { rootMarker } from "@/lib/idgen";
import { type Tree, type Node, hasChildren, getRawValue, isIterable, getChildrenKeys } from "@/lib/parser";
import { type XYPosition, type Edge, type Node as FlowNode } from "@xyflow/react";

export const config: Readonly<Record<string, any>> = {
  translateMargin: 500,
  panOnScrollSpeed: 1,
  minZoom: 0.5,
  maxZoom: 2,
  reconnectRadius: 20,
  colorMode: "light",
  attributionPosition: "bottom-left",
  imageWidth: 1024,
  imageHeight: 768,
};

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

// measured in MainPanel when mounted. The value should remain consistent between the main thread and the web worker.
export const globalStyle: GraphNodeStyle = {
  fontWidth: 0,
  padding: 0,
  borderWidth: 0,
  kvGap: 0,
  maxKeyWidth: 0,
  maxValueWidth: 0,
  kvHeight: 0,
  nodeGap: 25,
  levelGap: 75,
};

export function setupGlobalGraphStyle(style: Partial<GraphNodeStyle>) {
  Object.assign(globalStyle, style);
}

const selectedColor = "black";
export const nodeHighlightStyle: CSSProperties = { borderColor: selectedColor };
export const edgeHighlightStyle: CSSProperties = { stroke: selectedColor };

export type NodeWithData = FlowNode<{
  parentId: string;
  childrenIds: string[];
  level: number; // distance from root node
  depth: number; // max distance from leaf node
  width: number;
  height: number;
  renderArea: RenderArea;
  toolbarVisible?: boolean;
  style?: React.CSSProperties;
}>;

interface RenderArea {
  kvStart: number;
  kvEnd: number;
  dummyHandleStart?: number;
  dummyHandleEnd?: number;
}

export type EdgeWithData = Edge<{
  sourceHandleIndex: number; // the source handle index in the source node.
  targetHandleOffset: number; // the distance from the edge's ending point to the top of the target node.
  start: XYPosition; // the starting point of the edge, equals (source.x + source.width, source.y + sourceOffset)
  end: XYPosition; // the ending point of the edge, equals (target.x, target.y + targetOffset)
  style?: React.CSSProperties;
}>;

export interface Graph {
  nodes: NodeWithData[];
  edges: EdgeWithData[];
  levelMeta?: XYPosition[];
}

export function newGraph(): Graph {
  return { nodes: [], edges: [] };
}

// nodes are in DFS order and edges are in BFS order
export function genFlowNodes(tree: Tree): Graph {
  const nodes: NodeWithData[] = [];
  const edges: EdgeWithData[] = [];

  if (tree.hasChildren()) {
    doGenFlowNodes(nodes, edges, tree, tree.root(), "", 0);
  }

  return { nodes, edges };
}

function doGenFlowNodes(
  flowNodes: NodeWithData[],
  flowEdges: EdgeWithData[],
  tree: Tree,
  node: Node,
  parentId: string,
  level: number,
): number {
  const flowNode = newFlowNode(node, parentId, level);
  flowNodes.push(flowNode);

  let maxKvWidth = 0;
  let maxChildDepth = hasChildren(node) ? 0 : -1;

  tree.mapChildren(node, (child, key, i) => {
    const keyText = genKeyText(key);
    const { text } = genValueAttrs(child);
    const keyWidth = Math.min(computeTextWidth(keyText, globalStyle.fontWidth), globalStyle.maxKeyWidth);
    const valueWidth = Math.min(computeTextWidth(text, globalStyle.fontWidth), globalStyle.maxValueWidth);
    const kvWidth = globalStyle.padding + keyWidth + globalStyle.kvGap + valueWidth + 2 * globalStyle.borderWidth;
    maxKvWidth = Math.max(maxKvWidth, kvWidth);

    if (hasChildren(child)) {
      flowNode.data.childrenIds.push(child.id);
      flowEdges.push(newEdge(node, child, key, i));
      const childDepth = doGenFlowNodes(flowNodes, flowEdges, tree, child, flowNode.id, level + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
  });

  flowNode.data.width = maxKvWidth;
  flowNode.data.depth = maxChildDepth + 1;
  return flowNode.data.depth;
}

function newFlowNode(node: Node, parentId: string, level: number): NodeWithData {
  const childrenNum = getChildrenKeys(node).length;
  return {
    id: node.id,
    position: { x: 0, y: 0 },
    type: hasChildren(node) ? "object" : "root",
    data: {
      level,
      depth: 0,
      width: 0,
      height: childrenNum * globalStyle.kvHeight + 2 * globalStyle.borderWidth,
      parentId,
      childrenIds: [],
      renderArea: newRenderArea(childrenNum),
    },
    deletable: false,
    draggable: false,
  };
}

export function newRenderArea(childrenNum: number = 0) {
  return {
    kvStart: 0,
    kvEnd: childrenNum,
  };
}

function newEdge(parent: Node, child: Node, key: string, i: number): EdgeWithData {
  return {
    id: child.id,
    source: parent.id,
    target: child.id,
    sourceHandle: key,
    deletable: false,
    data: {
      sourceHandleIndex: i,
      targetHandleOffset: computeTargetHandleOffset(getChildrenKeys(child).length),
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
    },
  };
}

export class Layouter {
  tree: Tree;
  id2NodeMap: Record<string, NodeWithData>;

  constructor(tree: Tree, allNodes: NodeWithData[], allEdges: EdgeWithData[]) {
    this.tree = tree;
    this.id2NodeMap = {};
    for (const node of allNodes) {
      this.id2NodeMap[node.id] = node;
    }
  }

  layout() {
    const { ordered, levelMeta } = this.computeX();
    this.computeY(levelMeta, rootMarker, 0);
    return { ordered, levelMeta };
  }

  // use BFS to compute x of each node
  computeX() {
    const levelMeta: XYPosition[] = [];
    const ordered = [this.id2NodeMap[rootMarker]];

    for (let i = 0; i < ordered.length; i++) {
      const node = ordered[i];
      const { level, width } = node.data;

      if (level >= levelMeta.length) {
        levelMeta.push({ x: 0, y: 0 });
      }

      if (level > 0) {
        node.position.x = levelMeta[level - 1].x + globalStyle.levelGap;
      }

      levelMeta[level].x = Math.max(levelMeta[level].x, node.position.x + width);
      ordered.push(...node.data.childrenIds.map((id) => this.id2NodeMap[id]));
    }

    return { ordered, levelMeta };
  }

  // use DFS to compute y of each node
  computeY(levelMeta: XYPosition[], id: string, parentY: number) {
    const node = this.id2NodeMap[id];
    const { level, depth, height } = node.data;

    if (levelMeta[level].y === 0) {
      node.position.y = parentY;
    } else {
      for (let i = 0; i < depth; i++) {
        const y = Math.max(parentY, levelMeta[level + i].y + globalStyle.nodeGap);
        node.position.y = Math.max(node.position.y, y);
      }
    }

    levelMeta[level].y = node.position.y + height;

    for (const childId of node.data.childrenIds) {
      this.computeY(levelMeta, childId, node.position.y);
    }
  }
}

const re = /[\s\w\d\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\{\}\[\]\\\|\;\:\'\"\<\>\,\.\/\?]/g;

function computeTextWidth(text: string, fontWidth: number) {
  const single = (text.match(re) || []).length;
  const double = text.length - single;
  return Math.ceil((single + 2 * double) * fontWidth);
}

export function computeTargetHandleOffset(childrenNum: number) {
  return (childrenNum * globalStyle.kvHeight) / 2;
}

export function computeSourceHandleOffset(i: number) {
  return globalStyle.kvHeight / 2 + i * globalStyle.kvHeight;
}

export function genKeyText(key: string | number) {
  return String(key) || '""';
}

export function genValueAttrs(node: Node) {
  let classSuffix = node.type as string;
  let text = getRawValue(node)!;

  if (isIterable(node)) {
    classSuffix = hasChildren(node) ? "empty" : "null";
    text = node.type === "array" ? "[]" : "{}";
  } else if (node.type === "string") {
    if (node.value) {
      text = node.value;
    } else {
      classSuffix = "null";
      text = '""';
    }
  }

  return { className: `text-hl-${classSuffix}`, text };
}
