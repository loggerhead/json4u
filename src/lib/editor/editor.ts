import { toPath, toPointer } from "@/lib/idgen";
import { ParseOptions, Tree } from "@/lib/parser";
import { type ParsedTree } from "@/lib/worker/command/parse";
import { getEditorState } from "@/stores/editorStore";
import { getStatusState } from "@/stores/statusStore";
import { getTreeState } from "@/stores/treeStore";
import { sendGAEvent } from "@next/third-parties/google";
import { debounce } from "lodash-es";
import { editorApi, IScrollEvent } from "./types";

export type Kind = "main" | "secondary";
type ScrollEvent = IScrollEvent & { _oldScrollTop: number; _oldScrollLeft: number };

const parseWait = 500;

export class EditorWrapper {
  version: number;
  editor: editorApi.IStandaloneCodeEditor;
  kind: Kind;
  // 滚动中吗？
  scrolling: number;
  tree: Tree;
  delayParseAndSet: (text: string, extraOptions: ParseOptions, resetCursor: boolean, version: number) => void;

  constructor(editor: editorApi.IStandaloneCodeEditor, kind: Kind) {
    this.version = 0;
    this.editor = editor;
    this.kind = kind;
    this.scrolling = 0;
    this.tree = new Tree();
    this.delayParseAndSet = debounce(this.parseAndSet, parseWait, { trailing: true });
  }

  init() {
    this.version = this.model().getVersionId();
    this.listenOnDidPaste();
    this.listenOnKeyDown();
    this.listenOnDropFile();

    if (this.isMain()) {
      this.listenOnDidChangeCursorPosition();
    }
  }

  isMain() {
    return this.kind === "main";
  }

  model() {
    return this.editor.getModel()!;
  }

  text() {
    return this.editor.getValue();
  }

  worker() {
    return getEditorState().getWorker()!;
  }

  getAnotherEditor() {
    return getEditorState().getAnotherEditor(this.kind);
  }

  isTreeValid() {
    return this.tree.valid() && this.tree.version === this.version;
  }

  getPositionAt(offset: number) {
    return this.model().getPositionAt(offset);
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
    const { lineNumber, column } = this.getPositionAt(offset);
    this.revealPosition(lineNumber, column);
  }

  revealJsonPath(path: string[], index?: number) {
    const id = toPointer(index !== undefined ? path.slice(0, index + 1) : path);
    const offset = this.tree.node(id)?.offset;
    if (offset !== undefined) {
      this.revealOffset(offset);
    }
  }

  // NOTICE: Increase the version based on the model's current version rather than the previous version.
  incVersion() {
    this.version = this.model().getVersionId() + 1;
    return this.version;
  }

  setTree({ treeObject }: ParsedTree, resetCursor: boolean = true) {
    // increase version to skip next onChange event which triggered by setText
    const tree = Tree.fromObject(treeObject);
    tree.version = this.incVersion();
    getEditorState().resetHighlight();

    this.tree = tree;
    getTreeState().setTree(tree, this.kind);

    // 全量替换成新文本
    this.editor.executeEdits(null, [
      {
        text: tree.text,
        range: this.model().getFullModelRange(),
      },
    ]);
    // Indicates the above edit is a complete undo/redo change.
    this.editor.pushUndoStop();

    if (resetCursor) {
      this.revealPosition(1, 1);
    }

    console.log("Set tree:", tree);
    return tree;
  }

  async parseAndSet(
    text: string,
    extraParseOptions?: ParseOptions,
    resetCursor: boolean = true,
    version: number = this.version,
  ): Promise<{ set: boolean; parse: boolean }> {
    if (version < this.version) {
      console.log("Skip parseAndSet:", version, this.version);
      return { set: false, parse: false };
    }

    const options = {
      ...getStatusState().parseOptions,
      ...extraParseOptions,
      kind: this.kind,
    };

    reportTextSize(text.length);
    const parsedTree = await this.worker().parseAndFormat(text, version, options);
    const tree = this.setTree(parsedTree, resetCursor);
    return { set: true, parse: tree.valid() };
  }

  // There are three kinds of calling situation:
  // 1. paste on editor: onChange -> onDidPaste -> onDidPaste parseAndSet -> onChange parseAndSet (need ignore)
  // 2. input on editor: onChange -> parseAndSet
  // 3. execute command: parseAndSet
  async onChange(text: string | undefined, ev: editorApi.IModelContentChangedEvent) {
    const version = ev.versionId;
    if (version <= this.version) {
      console.log("Skip onChange:", version, this.version);
      return;
    }

    console.log("onChange:", version);
    await this.delayParseAndSet(text ?? "", { format: false }, false, version);
  }

  listenOnDidPaste() {
    this.editor.onDidPaste(async (event) => {
      // 仅当粘贴替换全部文本时，才执行 paste 相关的动作
      if (!event.range.equalsRange(this.model().getFullModelRange())) {
        console.log("Skip onDidPaste");
        return;
      }

      // increase version to skip next delayParseAndSet calling which triggered by onChange event
      this.incVersion();
      console.log("onDidPaste:", this.version);
      await this.parseAndSet(this.text());
    });
  }

  // 监听光标改变事件。显示光标停留位置的 json path
  listenOnDidChangeCursorPosition() {
    this.editor.onDidChangeCursorPosition((e) => {
      const model = this.model();
      const { lineNumber, column } = e.position;
      const selectionLength = model.getValueInRange(this.editor.getSelection()!).length;
      getStatusState().setCursorPosition(lineNumber, column, selectionLength);

      if (this.tree.valid()) {
        const text = this.text();

        // 获取当前光标在整个文档中的偏移量（offset）
        let offset = model.getOffsetAt(e.position);
        if (text[offset] === "\n" && text[offset - 1] === ",") {
          offset--;
        }

        // TODO tree 改变时重新获取当前的 offset 计算展示的 path
        const nodeId = this.tree.findNodeAtOffset(offset)?.id;
        if (nodeId) {
          getStatusState().setJsonPath(toPath(nodeId));
        }
      }
    });
  }

  // 注册拖拽事件处理器，支持拖拽文件到编辑器上
  listenOnDropFile() {
    this.editor.getDomNode()?.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];

      if (file) {
        // 读取拖拽的文件内容，并设置为编辑器的内容
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
        const state = getStatusState();
        state.setCommandOpen(!state.commandOpen);
      } else if (e.keyCode === window.monacoApi.KeyCode.Enter && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        getEditorState().callCommand("swapLeftRight");
      }
    });
  }

  // 监听滚动事件实现同步滚动
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
