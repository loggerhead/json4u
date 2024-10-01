import { NodeWithData, genValueAttrs } from "@/lib/graph/layout";
import { useTree } from "@/stores/treeStore";
import { type NodeProps } from "@xyflow/react";
import { SourceHandle } from "./Handle";
import Toolbar from "./Toolbar";

export default function RootNode({ data, ...props }: NodeProps<NodeWithData>) {
  const tree = useTree();
  const node = tree.root();

  if (!node) {
    return null;
  }

  const { className, text } = genValueAttrs(node);

  return (
    <>
      {data.toolbarVisible && <Toolbar node={node} />}
      <div className="graph-node" style={data.style}>
        <div className="graph-kv">
          <div className={className}>{text}</div>
          <SourceHandle node={node} />
        </div>
      </div>
    </>
  );
}
