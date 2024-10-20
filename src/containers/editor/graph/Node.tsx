import { memo } from "react";
import { computeSourceHandleOffset, genKeyText, genValueAttrs, globalStyle } from "@/lib/graph/layout";
import type { NodeWithData } from "@/lib/graph/types";
import { rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useTree } from "@/stores/treeStore";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { filter } from "lodash-es";
import { SourceHandle, TargetHandle } from "./Handle";
import Toolbar from "./Toolbar";

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
      <div className="graph-node nodrag nopan cursor-default" style={data.style} data-tree-id={id}>
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
                  valueClassName={className}
                  valueText={text}
                  hasChildren={hasChildren(child)}
                  isChildrenHidden={getNode(child.id)?.hidden ?? false}
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
  valueClassName: string;
  valueText: string;
  hasChildren: boolean;
  width: number; // used to avoid width jump when viewport changes
  isChildrenHidden: boolean;
}

const KV = memo(({ id, index, property, valueClassName, valueText, hasChildren, width, isChildrenHidden }: KvProps) => {
  const keyText = genKeyText(property);
  const keyClass = typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

  return (
    <div className="graph-kv" style={{ width }} data-tree-id={id}>
      <Popover
        content={
          <div className="popover-container" data-testid="popover-key">
            <div className={cn("popover-item", keyClass)} style={{ maxWidth: width }}>
              {keyText}
            </div>
          </div>
        }
      >
        <div className={cn("graph-k", keyClass)}>{keyText}</div>
      </Popover>
      <Popover
        content={
          <div className="popover-container" data-testid="popover-value">
            <div className={cn("popover-item", valueClassName)} style={{ maxWidth: width }}>
              {valueText}
            </div>
          </div>
        }
      >
        <div className={cn("graph-v", valueClassName)}>{valueText}</div>
      </Popover>
      {hasChildren && <SourceHandle id={keyText} indexInParent={index} isChildrenHidden={isChildrenHidden} />}
    </div>
  );
});
KV.displayName = "KV";

export const RootNode = memo(({ data }: NodeProps<NodeWithData>) => {
  const tree = useTree();
  const node = tree.root();

  if (!node) {
    return null;
  }

  const { className, text } = genValueAttrs(node);

  return (
    <div className="graph-node" style={data.style}>
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

function Popover({ children, content }: React.PropsWithChildren<{ content: JSX.Element }>): JSX.Element {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top">{content}</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
