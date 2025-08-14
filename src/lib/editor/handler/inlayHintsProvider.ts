import type { EditorWrapper } from "@/lib/editor/editor";
import type { languages, Range, editorApi, MonacoApi, IPosition } from "@/lib/editor/types";
import { getChildCount, type Tree, type Node, type NodeType, isIterable } from "@/lib/parser";

// Duplicate hints may appear after folding, which seems to be a bug in the Monaco editor:
// https://github.com/microsoft/monaco-editor/issues/4700
export class InlayHintsProvider {
  private editorWrapper: EditorWrapper;
  private monaco: MonacoApi["Raw"];
  // for cache
  private treeVersion?: number;
  private hints: languages.InlayHint[];

  constructor(editorWrapper: EditorWrapper) {
    this.editorWrapper = editorWrapper;
    this.monaco = window.monacoApi.Raw;
    this.treeVersion = 0;
    this.hints = [];
    this.registerInlayHintsProvider();
  }

  private registerInlayHintsProvider() {
    const provider = {
      provideInlayHints: (model: editorApi.ITextModel, range: Range) => {
        const tree = this.editorWrapper.tree;
        if (this.treeVersion === tree.version) {
          return { hints: this.hints, dispose: () => {} };
        }

        const res = collectChildCount(this.editorWrapper, model, tree, tree.root(), []);
        const hints: languages.InlayHint[] = res.map(({ count, position, type }) => ({
          label: type === "array" ? `[${count}]` : `{${count}}`,
          position: position,
          kind: this.monaco.languages.InlayHintKind.Type,
          paddingLeft: true,
          tooltip: type === "array" ? `${count} items` : `${count} keys`,
        }));

        this.hints = hints;
        this.treeVersion = tree.version;
        return { hints, dispose: () => {} };
      },
    };

    this.monaco.languages.registerInlayHintsProvider("json", provider);
  }
}

function collectChildCount(
  editorWrapper: EditorWrapper,
  model: editorApi.ITextModel,
  tree: Tree,
  node: Node,
  res: { count: number; position: IPosition; type: NodeType }[],
) {
  if (!(tree && node && isIterable(node))) {
    return [];
  }

  const { lineNumber, column } = editorWrapper.getPositionAt(node.offset);
  res.push({
    count: getChildCount(node),
    position: {
      lineNumber,
      column: column + 1,
    },
    type: node.type,
  });

  tree.nonLeafChildrenNodes(node).forEach((node) => {
    collectChildCount(editorWrapper, model, tree, node, res);
  });

  return res;
}
