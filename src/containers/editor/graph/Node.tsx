import { memo, type MouseEvent } from "react";
import { computeSourceHandleOffset, genKeyText, genValueAttrs, globalStyle } from "@/lib/graph/layout";
import type { EdgeWithData, NodeWithData, RevealType } from "@/lib/graph/types";
import { rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useTree } from "@/stores/treeStore";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { filter } from "lodash-es";
import { SourceHandle, TargetHandle } from "./Handle";
import Popover from "./Popover";
import Toolbar from "./Toolbar";
import { useClearSearchHl } from "./useViewportChange";

export const ObjectNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const { getNode } = useReactFlow();
  const tree = useTree();
  const node = tree.node(id);
  const flowNode = getNode(id) as NodeWithData | undefined;

  if (!node || !flowNode) {
    return null;
  }

  const width = flowNode.data.width;
  const childrenNum = getChildrenKeys(node).length;
  const { kvStart, kvEnd, virtualHandleIndices } = flowNode.data.render;

  return (
    <>
      {data.toolbarVisible && <Toolbar id={id} />}
      <div
        className="graph-node nodrag nopan cursor-default"
        role="treeitem"
        aria-selected={data.selected}
        data-tree-id={id}
        style={data.style}
      >
        {node.id !== rootMarker && <TargetHandle childrenNum={childrenNum} />}
        {kvStart > 0 && <div style={{ width, height: kvStart * globalStyle.kvHeight }} />}
        {filter(
          tree.mapChildren(node, (child, key, i) => {
            if (virtualHandleIndices?.[i]) {
              return (
                <Handle
                  key={i}
                  type="source"
                  isConnectable
                  id={key}
                  position={Position.Right}
                  style={{ top: computeSourceHandleOffset(i) }}
                />
              );
            } else if (kvStart <= i && i < kvEnd) {
              const { className, text } = genValueAttrs(child);
              return (
                <KV
                  id={child.id}
                  key={i}
                  index={i}
                  property={node.type === "array" ? i : key}
                  parentId={node.id}
                  valueClassName={className}
                  valueText={text}
                  hasChildren={hasChildren(child)}
                  isChildrenHidden={getNode(child.id)?.hidden ?? false}
                  selected={data.idOfSelectedKV === child.id}
                  width={width}
                />
              );
            } else {
              return null;
            }
          }),
        )}
        {childrenNum > kvEnd && <div style={{ width, height: (childrenNum - kvEnd) * globalStyle.kvHeight }} />}
      </div>
    </>
  );
});
ObjectNode.displayName = "ObjectNode";

interface KvProps {
  id: string;
  index: number;
  property: string | number;
  parentId: string;
  valueClassName: string;
  valueText: string;
  hasChildren: boolean;
  width: number; // used to avoid width jump when viewport changes
  isChildrenHidden: boolean;
  selected?: boolean;
}

const KV = memo((props: KvProps) => {
  const keyText = genKeyText(props.property);
  const keyClass = typeof props.property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

  const { setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);
  const clearSearchHl = useClearSearchHl();

  const onClick = (e: MouseEvent, type: RevealType) => {
    e.stopPropagation();
    clearSearchHl(props.parentId);
    setRevealPosition({
      treeNodeId: props.id,
      type: type,
      from: "graph",
    });

    (async () => {
      const { nodes, edges } = await window.worker.toggleGraphNodeSelected(props.parentId, props.id);
      setNodes(nodes);
      setEdges(edges);
    })();
  };

  return (
    <div
      className={cn(
        "graph-kv hover:bg-blue-100 dark:hover:bg-blue-900",
        props.selected && "bg-blue-100 dark:bg-blue-900",
      )}
      style={{ width: props.width }}
      data-tree-id={props.id}
      onClick={(e) => onClick(e, "key")}
    >
      <Popover width={props.width} hlClass={keyClass} text={keyText}>
        <div className={cn("graph-k hover:bg-yellow-100", keyClass)}>{keyText}</div>
      </Popover>
      <Popover width={props.width} hlClass={props.valueClassName} text={props.valueText}>
        <div className={cn("graph-v hover:bg-yellow-100", props.valueClassName)} onClick={(e) => onClick(e, "value")}>
          {props.valueText}
        </div>
      </Popover>
      {props.hasChildren && (
        <SourceHandle id={keyText} indexInParent={props.index} isChildrenHidden={props.isChildrenHidden} />
      )}
    </div>
  );
});
KV.displayName = "KV";

export const RootNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const tree = useTree();
  const node = tree.root();

  if (!node) {
    return null;
  }

  const { className, text } = genValueAttrs(node);

  return (
    <div className="graph-node" style={data.style} role="treeitem" aria-selected={data.selected} data-tree-id={id}>
      <div className="graph-kv">
        <div className={className}>{text}</div>
      </div>
    </div>
  );
});
RootNode.displayName = "RootNode";

// if the target of the edge is not in the viewport, then use a VirtualTargetNode to represent it
export const VirtualTargetNode = memo(() => {
  return (
    <div className="w-[1px] h-[1px]">
      <Handle type={"target"} isConnectable position={Position.Left} />
    </div>
  );
});
VirtualTargetNode.displayName = "VirtualTargetNode";
