import type { RevealTarget } from "@/lib/graph/types";
import { NodeType, ParseOptions, Tree } from "@/lib/parser";
import { type ParsedTree } from "@/lib/worker/command/parse";
import { getEditorState } from "@/stores/editorStore";
import { getStatusState, type TreeEdit } from "@/stores/statusStore";
import { getTreeState } from "@/stores/treeStore";
import { sendGAEvent } from "@next/third-parties/google";
import { debounce, includes, type DebouncedFunc } from "lodash-es";
import { HoverProvider } from "./handler/hoverProvider";
import { InlayHintsProvider } from "./handler/inlayHintsProvider";
import { editorApi, IPosition, IScrollEvent } from "./types";

export type Kind = "main" | "secondary";
type ScrollEvent = IScrollEvent & { _oldScrollTop: number; _oldScrollLeft: number };

const parseWait = 300;

export class EditorWrapper {
  editor: editorApi.IStandaloneCodeEditor;
  kind: Kind;
  // Is it scrolling?
  scrolling: number;
  tree: Tree;
  delayParseAndSet: DebouncedFunc<(text: string, extraOptions: ParseOptions, resetCursor: boolean) => void>;

  constructor(editor: editorApi.IStandaloneCodeEditor, kind: Kind) {
    this.editor = editor;
    this.kind = kind;
    this.scrolling = 0;
    this.tree = new Tree();
    this.delayParseAndSet = debounce(this.parseAndSet, parseWait, { trailing: true });
  }

  init() {
    this.listenOnChange();
    this.listenOnDidPaste();
    this.listenOnKeyDown();
    this.listenOnDropFile();
    new HoverProvider(this);
    new InlayHintsProvider(this);

    if (this.isMain()) {
      this.listenOnDidChangeCursorPosition();
    }
  }

  isMain() {
    return this.kind === "main";
  }

  model() {
    return this.editor.getModel();
  }

  text() {
    return this.editor.getValue();
  }

  worker() {
    return window.worker;
  }

  getAnotherEditor() {
    return getEditorState().getAnotherEditor(this.kind);
  }

  isTreeValid() {
    return this.tree.valid();
  }

  // convert offset at text to {lineNumber, column}
  getPositionAt(offset: number): { lineNumber: number; column: number } {
    return this.model()?.getPositionAt(offset) ?? { lineNumber: 1, column: 1 };
  }

  range(offset: number, length: number) {
    return window.monacoApi.RangeFromPositions(this.getPositionAt(offset), this.getPositionAt(offset + length));
  }

  revealPosition(lineNumber: number, column: number = 1, focus: boolean = true) {
    if (focus) {
      this.editor.focus();
    }

    const pos = { lineNumber, column };
    this.editor.setPosition(pos);
    this.editor.revealPositionInCenter(pos);
  }

  revealOffset(offset: number) {
    const p = this.getPositionAt(offset);
    if (p) {
      this.revealPosition(p.lineNumber, p.column);
    }
  }

  setNodeSelection(nodeId: string, target: RevealTarget) {
    const node = this.tree.node(nodeId);
    if (!node) {
      return;
    }

    let offset = 0;
    let length = 0;

    if (target === "graphNode" || target === "keyValue") {
      offset = node.boundOffset;
      length = node.boundLength;
    } else if (target === "key") {
      offset = node.boundOffset;
      length = node.keyLength + 2;
    } else if (target === "value") {
      offset = node.offset;
      length = node.length;
    }

    if (length === 0) {
      return;
    }

    this.revealOffset(offset + 1);
    const range = this.range(offset, length);
    this.editor.setSelection(range);
  }

  setTree({ treeObject }: ParsedTree, resetCursor: boolean = true) {
    const tree = Tree.fromObject(treeObject);
    tree.needReset = resetCursor;
    getEditorState().resetHighlight();

    this.tree = tree;
    getTreeState().setTree(tree, this.kind);

    // replace editor text to the new tree text
    this.editor.executeEdits(null, [
      {
        text: tree.text,
        range: this.model()?.getFullModelRange() ?? {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: Infinity,
          endColumn: Infinity,
        },
      },
    ]);
    // Indicates the above edit is a complete undo/redo change.
    this.editor.pushUndoStop();

    if (resetCursor) {
      this.revealPosition(1, 1);
    }

    console.l("set tree:", tree);
    return tree;
  }

  /**
   * Applies a batch of structured tree edits, typically originating from UI components like the graph view,
   * to the Monaco editor. This function serves as a specialized bridge, translating high-level, intent-based
   * edit requests into precise, low-level text manipulations.
   */
  applyTreeEdits(treeEdits: Array<TreeEdit>) {
    // Keep the last value for each treeNodeId in edits
    const uniqueEdits: Array<TreeEdit> = [];
    const idMap = new Map<string, number>();
    treeEdits.forEach((edit, index) => idMap.set(edit.treeNodeId, index));
    idMap.forEach((index) => uniqueEdits.push(treeEdits[index]));

    treeEdits = uniqueEdits.filter((edit) => edit.version === this.tree.version);

    const nodes = treeEdits
      .map((edit) => ({
        ...this.tree.node(edit.treeNodeId),
        newValue: edit.value,
        editTarget: edit.target,
      }))
      .filter((node) => node);
    if (nodes.length === 0) {
      return;
    }

    const edits = nodes.map(({ editTarget, newValue, ...nd }) => ({
      text:
        editTarget === "key" || includes<NodeType>(["string", "object", "array"], nd.type) ? `"${newValue}"` : newValue,
      range: editTarget === "key" ? this.range(nd.boundOffset, nd.keyLength + 2) : this.range(nd.offset, nd.length),
    }));
    console.l("edit nodes: ", treeEdits, nodes, edits);

    this.editor.executeEdits(null, edits);
    this.editor.pushUndoStop();
  }

  async parseAndSet(
    text: string,
    extraParseOptions?: ParseOptions,
    resetCursor: boolean = true,
  ): Promise<{ set: boolean; parse: boolean }> {
    const options = {
      ...getStatusState().parseOptions,
      ...extraParseOptions,
      kind: this.kind,
    };

    reportTextSize(text.length);
    const parsedTree = await this.worker().parseAndFormat(text, options);
    const tree = this.setTree(parsedTree, resetCursor);
    return { set: true, parse: tree.valid() };
  }

  listenOnChange() {
    this.editor.onDidChangeModelContent(async (ev) => {
      const prevText = this.tree.text;
      const text = this.text();

      if (text !== prevText) {
        console.l("onChange:", ev.versionId);
        this.delayParseAndSet.cancel();
        await this.delayParseAndSet(text, { format: false }, false);
      } else {
        console.l("skip onChange:", ev.versionId);
      }
    });
  }

  listenOnDidPaste() {
    this.editor.onDidPaste(async (ev) => {
      const model = this.model();
      const text = this.text();
      const versionId = model?.getVersionId();

      // if all text is replaced by pasted text
      if (model && text.length > 0 && ev.range.equalsRange(model.getFullModelRange())) {
        console.l("onDidPaste:", versionId, text.length, text.slice(0, 20));
        // for avoid triggering onChange
        this.tree.text = text;
        // sometimes onChange will triggered before onDidPaste, so we need to cancel it
        this.delayParseAndSet.cancel();
        await this.parseAndSet(text);
      } else {
        console.l("skip onDidPaste:", versionId, text.length, text.slice(0, 20));
      }
    });
  }

  // Listen for cursor change events. Displays the json path of the cursor position.
  listenOnDidChangeCursorPosition() {
    const onDidChangeCursorPosition = debounce(
      (e) => {
        const model = this.model();
        const selectionLength = model?.getValueInRange(this.editor.getSelection()!).length ?? 0;
        const { lineNumber, column } = e.position;
        getStatusState().setCursorPosition(lineNumber, column, selectionLength);
        const r = this.getNodeAtPosition(e.position);

        if (!r?.node) {
          return;
        }

        if (e.source == "mouse") {
          getStatusState().setRevealPosition({
            treeNodeId: r.node.id,
            target: r.target,
            from: "editor",
          });
        }
      },
      200,
      { trailing: true },
    );

    this.editor.onDidChangeCursorPosition(onDidChangeCursorPosition);
  }

  getNodeAtPosition(pos: IPosition) {
    const model = this.model();

    if (!(model && this.tree.valid())) {
      return undefined;
    }

    const text = this.text();

    // Get the offset of the current cursor in the entire document.
    let offset = model.getOffsetAt(pos);
    if (text[offset] === "\n" && text[offset - 1] === ",") {
      offset--;
    }

    return this.tree.findNodeAtOffset(offset);
  }

  // Register a drag event handler to support dragging files to the editor.
  listenOnDropFile() {
    this.editor.getDomNode()?.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];

      if (file) {
        // Read the content of the dragged file and set it as the content of the editor.
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result;
          typeof text === "string" && this.parseAndSet(text);
        };
        reader.readAsText(file);
      }
    });
  }

  listenOnKeyDown() {
    this.editor.onKeyDown((e) => {
      if (e.keyCode === window.monacoApi.KeyCode.KeyK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        window.searchComponents?.["cmd-search-input"]?.focus();
      } else if (e.keyCode === window.monacoApi.KeyCode.Enter && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        getEditorState().runCommand("swapLeftRight");
      }
    });
  }

  // Listen for scroll events to achieve synchronous scrolling.
  listenOnScroll() {
    this.editor.onDidScrollChange((e) => {
      this.scrolling = Math.min(this.scrolling + 1, 1);
      if (this.scrollable()) {
        this.getAnotherEditor()?.scrollTo(e as ScrollEvent);
      }
    });
  }

  scrollTo(e: ScrollEvent) {
    if (e.scrollTopChanged || e.scrollLeftChanged) {
      // prevent next scroll
      this.scrolling = -1;
      const top = this.editor.getScrollTop();
      const left = this.editor.getScrollLeft();
      const absoluteTop = top + e.scrollTop - e._oldScrollTop;
      const absoluteLeft = left + e.scrollLeft - e._oldScrollLeft;
      this.editor.setScrollTop(absoluteTop);
      this.editor.setScrollLeft(absoluteLeft);
    }
  }

  scrollable() {
    return this.scrolling && getStatusState().enableSyncScroll;
  }
}

function reportTextSize(size: number) {
  let kind = "";

  if (size <= 10 * 1024) {
    kind = "(0, 10kb]";
  } else if (size <= 100 * 1024) {
    kind = "(10kb, 100kb]";
  } else if (size <= 500 * 1024) {
    kind = "(100kb, 500kb]";
  } else {
    kind = "(500kb, +∞)";
  }

  sendGAEvent("event", "text_size", { kind });
}
