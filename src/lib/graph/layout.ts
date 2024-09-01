import { type CSSProperties } from "react";
import { rootMarker } from "@/lib/idgen";
import { type Tree, type Node, hasChildren, getRawValue, isIterable, getChildrenKeys } from "@/lib/parser";
import { type XYPosition, type Edge, type Node as FlowNode } from "@xyflow/react";
import { max } from "lodash-es";

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

// TODO: improve color
export const nodeHighlightStyle: CSSProperties = { borderColor: "red" };
export const edgeHighlightStyle: CSSProperties = { stroke: "red", strokeWidth: 2 };

export type NodeWithData = FlowNode<{
  parentId: string;
  childrenIds: string[];
  level: number; // distance from root node
  depth: number; // max distance from leaf node
  toolbarVisible?: boolean;
  style?: React.CSSProperties;
}>;

export type EdgeWithData = Edge<{
  key: string;
  style?: React.CSSProperties;
}>;

export interface Graph {
  nodes: NodeWithData[];
  edges: EdgeWithData[];
  levelMeta?: XYPosition[];
}

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

  const childDepths = tree.mapChildren(node, (child, key) => {
    if (hasChildren(child)) {
      flowNode.data.childrenIds.push(child.id);
      flowEdges.push(newEdge(node, child, key));
      return doGenFlowNodes(flowNodes, flowEdges, tree, child, flowNode.id, level + 1);
    }
    return 0;
  });

  flowNode.data.depth = 1 + (max(childDepths) ?? -1);
  return flowNode.data.depth;
}

function newFlowNode(node: Node, parentId: string, level: number): NodeWithData {
  return {
    id: node.id,
    position: { x: 0, y: 0 },
    type: hasChildren(node) ? "object" : "root",
    data: { level, depth: 0, parentId, childrenIds: [] },
    deletable: false,
    draggable: false,
  };
}

function newEdge(parent: Node, child: Node, key: string): EdgeWithData {
  return {
    id: child.id,
    source: parent.id,
    target: child.id,
    sourceHandle: key,
    deletable: false,
  };
}

export class Layouter {
  tree: Tree;
  id2NodeMap: Record<string, NodeWithData>;
  style: GraphNodeStyle;

  constructor(style: GraphNodeStyle, tree: Tree, allNodes: NodeWithData[]) {
    this.style = style;
    this.tree = tree;
    this.id2NodeMap = {};
    for (const node of allNodes) {
      this.id2NodeMap[node.id] = { ...node };
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
      const level = node.data.level;
      const width = this.getNodeWidth(node);

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
    const level = node.data.level;
    const depth = node.data.depth;
    const height = this.getNodeHeight(node);

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

  getNodeWidth(nd: NodeWithData): number {
    const width = nd.measured?.width ?? 0;
    if (width > 0) {
      return width;
    }

    const node = this.tree.node(nd.id);
    let maxWidth = 0;

    this.tree.mapChildren(node, (child, key) => {
      const keyText = genKeyText(key);
      const { text } = genValueAttrs(child);
      const keyWidth = Math.min(computeTextWidth(keyText, this.style.fontWidth), this.style.maxKeyWidth);
      const valueWidth = Math.min(computeTextWidth(text, this.style.fontWidth), this.style.maxValueWidth);
      const width = this.style.padding + keyWidth + this.style.kvGap + valueWidth + 2 * this.style.borderWidth;
      maxWidth = Math.max(maxWidth, width);
    });

    return maxWidth;
  }

  getNodeHeight(nd: NodeWithData): number {
    let height = nd.measured?.height ?? 0;
    if (height > 0) {
      return height;
    }

    const node = this.tree.node(nd.id);
    height = getChildrenKeys(node).length * this.style.kvHeight + 2 * this.style.borderWidth;
    return height;
  }
}

const re = /[\s\w\d\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\{\}\[\]\\\|\;\:\'\"\<\>\,\.\/\?]/g;

function computeTextWidth(text: string, fontWidth: number) {
  const single = (text.match(re) || []).length;
  const double = text.length - single;
  return Math.ceil((single + 2 * double) * fontWidth);
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
