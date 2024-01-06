import * as editorApi from "monaco-editor/esm/vs/editor/editor.api";
import * as monacoActions from 'monaco-editor/esm/vs/platform/actions/common/actions';
import * as jsonc from "../jsonc-parser/main";
import * as color from "../color";
import * as pointer from "../pointer";
import * as compare from "../compare";
import {DiffResult} from "../compare";
import * as parser from "../parser";
import * as escape from "../escape";
import PlaceholderContentWidget from "./placeholder-widget";
import {Message} from "@arco-design/web-react";
import {setFocusLeft, setFocusRight, setLeftWidth, setStatusBar} from "@/reducers";
import {getLeftWidthByPrev, isRightEditorHidden} from "@/lib/store";

const StatusBarValidate = "r100"; // 虚拟状态栏 ID
const StatusBarPos = "l1";
const StatusBarPath = "l2";
const StatusBarLeftValidate = "r1";
const StatusBarRightValidate = "r2";
const StatusBarSetting = "r3";
const StatusBarCompare = "r4";

export class EditorRef {
  constructor(store, dispatch, editor) {
    // redux
    this.store = store;
    this.dispatch = dispatch;
    // monaco editor 实例
    this.editor = editor;
    // 编辑器下方状态栏文本
    this.setStatusBarBuf = {id: 0, tasks: {}};
    // 滚动中吗？
    this.scrolling = false;
    // 启用同步滚动？
    this.enableSyncScroll = true;
    // 菜单项。key: value => 函数名: 菜单属性
    this.menuItems = new Map();
    // 比较后的差异
    this.diffResult = new compare.DiffResult([]);
    // 上一次编辑器生成的装饰集合
    this.previousDecorations = null;
    // worker 执行完成时回调的函数
    this.workerCallback = {};
  }

  static handleCompareResult(self, diffResult) {
    const dr = DiffResult.newFromObj(diffResult);
    // 进行比较
    dr.genRanges(self.leftEditor, self.rightEditor);
    self.leftEditor.diffResult = dr;
    self.rightEditor.diffResult = dr;
    // 高亮 diff
    self.highlight();
    // 状态栏显示 diff 信息
    self.showDiffMsg();
    // 滚动到第一个 diff
    self.leftEditor.jumpToDiff(0);
    self.rightEditor.jumpToDiff(0);
  }

  isLeft() {
    return this === this.leftEditor;
  }

  // 获取 monaco.editor.model
  model() {
    return this.editor.getModel();
  }

  // 获取 monaco.editor.value
  text() {
    return this.editor.getValue();
  }

  // 设置 monaco.editor.value。文本发生变更时，清空 diff 高亮和 diffs 信息
  setText(text) {
    // 避免 executeEdits 里面 null 导致的报错
    this.editor.setSelection(new editorApi.Range(0, 0, 0, 0));
    // 全量替换成新文本
    this.editor.executeEdits(null, [
      {
        text: text,
        range: this.editor.getModel().getFullModelRange(),
      },
    ]);
    // Indicates the above edit is a complete undo/redo change.
    this.editor.pushUndoStop();
  }

  state() {
    const state = this.store.getState();

    return {
      ...state.settings,
      ...state.ctx,
    };
  }

  worker() {
    return this.state().worker;
  }

  call(cmd, data = this.text(), callback = null) {
    this.workerCallback[cmd] = callback;
    this.worker().postMessage({
      cmd: cmd,
      isLeft: this.isLeft(),
      data: data,
    });
  }

  registerWorkerCallback() {
    this.worker().onmessage = (event) => {
      const {isLeft, cmd, data} = event.data;
      const self = isLeft ? this.leftEditor : this.rightEditor;

      if (!self) {
        return;
      }

      const callback = self.workerCallback[cmd];

      if (callback) {
        callback(self, data);
      } else {
        self.setText(data);
      }

      self.revealLine(1);
    };
  }

  setStatusBarText(text, id, blink = false) {
    // 计算需要展示的背景色
    const [_, colors] = color.matchColorTags(text);
    const prefixColor = color.max(colors);

    const o = {};
    let richText = text;

    // 需要生成前缀吗？
    if (id === StatusBarValidate) {
      id = this.isLeft() ? StatusBarLeftValidate : StatusBarRightValidate;

      if (text.trim().length) {
        const prefix = this.isLeft() ? "左侧" : "右侧";
        richText = `<${prefixColor}>${prefix}</${prefixColor}>${text}`;
      }
    }

    o[id] = {
      text: text ? `<black>${richText}</black>` : "",
      blink: blink,
    };

    // 防抖动
    this.setStatusBarBuf.tasks = Object.assign(this.setStatusBarBuf.tasks, o);
    clearTimeout(this.setStatusBarBuf.id);

    this.setStatusBarBuf.id = setTimeout(() => {
      this.dispatch(setStatusBar(this.setStatusBarBuf.tasks));
      this.setStatusBarBuf.tasks = {};
    }, 50);
  }

  // 重置 diff 高亮状态
  resetDiffDecorations() {
    const clear = (editor) => {
      // 清除行高亮
      editor.clearDecorations();
      // 清除 diff 填充块
      editor.clearViewZones();
      // 清除状态栏文案
      editor.setStatusBarText("", StatusBarCompare);
      editor.diffResult = new compare.DiffResult([]);
    };

    if (this.leftEditor) {
      clear(this.leftEditor);
    }
    if (this.rightEditor) {
      clear(this.rightEditor);
    }
  }

  // 生成 Range
  range(offset, length) {
    const model = this.model();
    return editorApi.Range.fromPositions(model.getPositionAt(offset), model.getPositionAt(offset + length));
  }

  // 一行能显示的字符数（粗估）
  lineCharNum() {
    const layout = this.editor.getLayoutInfo();
    const fontInfo = this.editor.getOptions().get(editorApi.editor.EditorOption.fontInfo);
    const n = Math.floor(layout.contentWidth / fontInfo.spaceWidth);
    return n;
  }

  // 校验 json valid
  validate() {
    if (this.text().trim().length) {
      // NOTICE: 不能挪到 worker 中执行，因为可能出现状态不一致的情况
      const node = parser.parseJSON(this.text());
      const errmsg = this.genErrorAlert(node.errors);
      this.setStatusBarText(errmsg, StatusBarValidate);
    } else {
      this.setStatusBarText("", StatusBarValidate);
    }
  }

  /** @return {ParseOptions} */
  genOptions(fields = {}) {
    return Object.assign({
      nest: this.state().enableNestParse,
      format: this.state().enableAutoFormat,
      order: this.state().enableAutoSort ? "asc" : "",
      printWidth: this.lineCharNum(),
    }, fields);
  }

  // 格式化
  format() {
    const data = {
      text: this.text(),
      options: this.genOptions(),
    };

    this.call("format", data);
  }

  // 最小化
  minify() {
    this.call("minify", this.text(), (self, data) => {
      const {text, errors} = data;
      const errmsg = self.genErrorAlert(errors);

      if (errmsg) {
        self.setStatusBarText(errmsg, StatusBarValidate);
      }

      self.setText(text);
    });
  }

  // 对 JSON 字符串做转义
  escape() {
    this.call("escape");
  }

  // 对 JSON 字符串做反转义
  unescape() {
    this.call("unescape");
  }

  // URL 转 JSON
  urlToJSON() {
    const data = {
      text: this.text(),
      options: this.genOptions(),
    };

    this.call("urlToJSON", data, (self, data) => {
      const {text, error} = data;

      if (error) {
        Message.error(`URL 解析出错: ${error.toString()}`);
      } else {
        self.setText(text);
      }
    });
  }

  // 将 python dict 转成 JSON
  pythonDict2JSON() {
    const data = {
      text: this.text(),
      options: this.genOptions(),
    };
    this.call("pythonDict2JSON", data);
  }

  // 对 JSON 按 key 升序排序
  sort(order = "asc") {
    const data = {
      text: this.text(),
      options: this.genOptions({order}),
    };

    this.call("sort", data, (self, data) => {
      const {text, errors} = data;

      if (errors.length === 0) {
        self.setText(text);
      } else {
        Message.error("排序失败：JSON 解析出错");
      }
    });
  }

  // 对 JSON 按 key 降序排序
  sortReverse() {
    this.sort("desc");
  }

  // 对两侧文本做语义化比较
  compare(needTextCompare = false) {
    this.resetDiffDecorations();

    const data = {
      ltext: this.leftEditor.text(),
      rtext: this.rightEditor.text(),
      options: {...this.genOptions(), needTextCompare},
    };

    this.call("compare", data, EditorRef.handleCompareResult);
  }

  // 粘贴时执行的动作
  onPaste(text = undefined) {
    let ltext = this.leftEditor.text();
    let rtext = this.rightEditor.text();

    if (typeof text === "string") {
      if (this.isLeft()) {
        ltext = text;
      } else {
        rtext = text;
      }
    }

    const data = {
      ltext: ltext,
      rtext: rtext,
      options: this.genOptions(),
    };

    this.call("handlePaste", data, (self, data) => {
      const {text, errors, diffResult, needShowRightEditor} = data;
      self.setText(text);

      if (needShowRightEditor && isRightEditorHidden(this.state().leftWidth)) {
        self.dispatch(setLeftWidth(getLeftWidthByPrev(this.state().prevLeftWidth)));
      }

      if (diffResult) {
        EditorRef.handleCompareResult(self, diffResult);
      }
    });
  }

  // 跳转到上一个差异
  jumpToPrevDiff() {
    this.jumpToDiff(-1);
  }

  // 跳转到下一个差异
  jumpToNextDiff() {
    this.jumpToDiff(1);
  }

  // 跳转到指定差异
  jumpToDiff(direction = 0) {
    // 防抖处理
    clearTimeout(this.jumpToDiffID);
    const diffs = this.isLeft() ? this.diffResult.ldiffs : this.diffResult.rdiffs;
    let index = direction >= 0 ? 0 : diffs.length - 1;

    // 按跳转方向找到超过当前光标位置的下一个差异
    if (direction !== 0) {
      let {startLineNumber} = diffs[index]?.range;
      const {lineNumber} = this.editor.getPosition();

      while ((direction > 0 && startLineNumber <= lineNumber) || (direction < 0 && startLineNumber >= lineNumber)) {
        index += direction;

        // 往上超过第一个差异时
        if (index < 0) {
          index = diffs.length - 1;
          break;
          // 往下超过最后一个差异时
        } else if (index > diffs.length - 1) {
          index = 0;
          break;
        }

        startLineNumber = diffs[index].range.startLineNumber;
      }
    }

    this.jumpToDiffID = setTimeout(() => {
      const range = diffs[index]?.range;

      if (range) {
        this.revealLine(range.startLineNumber);
      }
    }, 100);
  }

  // 滚动到指定行
  // TODO: 会导致跳转差异时未同步滚动的 bug
  revealLine(lineNumber, column = 1) {
    // 禁用同步滚动
    const leftEnable = this.leftEditor.enableSyncScroll;
    const rightEnable = this.rightEditor.enableSyncScroll;
    this.leftEditor.enableSyncScroll = false;
    this.rightEditor.enableSyncScroll = false;

    const pos = {lineNumber: lineNumber, column: column};
    this.editor.setPosition(pos);
    this.editor.revealPositionInCenter(pos);

    this.leftEditor.enableSyncScroll = leftEnable;
    this.rightEditor.enableSyncScroll = rightEnable;
  }

  // 提示用户 diff 信息
  showDiffMsg() {
    const msgs = [];
    const [delN, insN] = this.diffResult.countLines();
    const noDiff = delN + insN === 0;

    if (noDiff) {
      Message.success({
        duration: 2000,
        content: "两边没有差异",
      });
    } else {
      if (this.diffResult.isTextCompare) {
        msgs.push("<black>进行文本比较</black>");
      }

      msgs.push(`<red>-${delN}</red> <green>+${insN}</green>`);
    }

    const msg = msgs.join("。");
    this.setStatusBarText(msg, StatusBarCompare, noDiff);
  }

  // 高亮
  highlight() {
    const [leftDecorations, rightDecorations] = this.genDecorations();
    this.leftEditor.applyDecorations(leftDecorations);
    this.rightEditor.applyDecorations(rightDecorations);

    // 如果是文本比较，生成 diff 填充块
    if (this.diffResult.isTextCompare) {
      const [leftFills, rightFills] = compare.generateFillRanges(this.diffResult.hunkDiffs());
      this.diffResult.leftViewZoneIDs = this.leftEditor.applyViewZones(leftFills);
      this.diffResult.rightViewZoneIDs = this.rightEditor.applyViewZones(rightFills);
    }
  }

  // 生成高亮装饰
  genDecorations() {
    const leftDecorations = [];
    const rightDecorations = [];
    const hunkDiffs = this.diffResult.hunkDiffs();

    const genDecoration = (hunkDiff) => {
      const type = hunkDiff.type;
      const editor = type === compare.DEL ? this.leftEditor : this.rightEditor;

      // 计算行内差异 size
      const inlineSize = hunkDiff.inlineDiffs.reduce((acc, d) => {
        return acc + d.length;
      }, 0);

      const decoration = editor.newHighlightDecoration(hunkDiff.range, false, type);
      const inlineDecorations = hunkDiff.inlineDiffs.map((d) => {
        return editor.newHighlightDecoration(d.range, true, type);
      });
      return [decoration, inlineDecorations, inlineSize];
    };

    const addDecorations = (type, decoration, inlineDecorations = []) => {
      (type === compare.DEL ? leftDecorations : rightDecorations).push(decoration, ...inlineDecorations);
    };

    const isShowInlineDiffs = (inlineSize, hunkDiff, inlineSizeNext = 0, hunkDiffNext = null) => {
      const cfg = {
        // 当行内差异总长度 < 20 时，高亮行内差异
        size: 20,
        // 当 (行内差异总长度/块差异长度) > 0.7 时，不高亮
        rate: 0.7,
        // 当行内差异数量 > 10 时，不高亮
        inlineNum: 10,
      };
      const nextSize = hunkDiffNext?.length || 0;
      const nextInlineNum = hunkDiffNext?.inlineDiffs.length || 0;

      if (inlineSize + 1 >= hunkDiff.length || (nextSize > 0 && inlineSizeNext + 1 >= nextSize)) {
        return false;
      } else if (inlineSize + inlineSizeNext < cfg.size) {
        return true;
      } else if (inlineSize > hunkDiff.length * cfg.rate || inlineSizeNext > nextSize * cfg.rate) {
        return false;
      } else if (hunkDiff.inlineDiffs.length + nextInlineNum > cfg.inlineNum) {
        return false;
      }

      return true;
    };

    // 生成 diff 块高亮和行内高亮
    for (let i = 0; i < hunkDiffs.length;) {
      const hunkDiff = hunkDiffs[i];
      const hunkDiffNext = hunkDiffs[i + 1];
      const type = hunkDiff.type;
      const typeNext = hunkDiffNext?.type;
      const [decoration, inlineDecorations, inlineSize] = genDecoration(hunkDiff);

      if (typeNext && type === compare.DEL && typeNext === compare.INS) {
        const [decorationNext, inlineDecorationsNext, inlineSizeNext] = genDecoration(hunkDiffNext);

        if (isShowInlineDiffs(inlineSize, hunkDiff, inlineSizeNext, hunkDiffNext)) {
          addDecorations(type, decoration, inlineDecorations);
          addDecorations(typeNext, decorationNext, inlineDecorationsNext);
        } else {
          addDecorations(type, decoration);
          addDecorations(typeNext, decorationNext);
        }

        i += 2;
      } else {
        if (isShowInlineDiffs(inlineSize, hunkDiff)) {
          addDecorations(type, decoration, inlineDecorations);
        } else {
          addDecorations(type, decoration);
        }

        i++;
      }
    }

    return [leftDecorations, rightDecorations];
  }

  // 文本改变时执行的动作
  onChange() {
    this.resetDiffDecorations();

    clearTimeout(this.onChangeID);
    this.onChangeID = setTimeout(() => {
      this.validate();
    }, 500);
  }

  // 将两侧编辑器互相关联
  pair(leftEditor, rightEditor) {
    this.leftEditor = leftEditor;
    this.rightEditor = rightEditor;
    this.registerPlaceholderWidget();
    this.registerWorkerCallback();
  }

  // 编辑器初始化
  init() {
    this.removeMenuItems();

    this.registerDidFocus();
    this.registerOnPaste();
    this.registerAutoShowMinimap();
    this.registerDropFileHandler();
    this.registerPositionChange();
    this.registerOnScroll();
    this.registerMenuItems();
    this.registerSuppressSyncScroll();
    return this;
  }

  registerPlaceholderWidget() {
    let lines;

    if (this.isLeft()) {
      lines = [
        "拖拽上传文件",
      ];
    } else if (this === this.rightEditor) {
      lines = [
        "- 右键打开菜单",
        "- 拖动左侧可调整窗口大小",
        "- 按住 Alt 暂停同步滚动",
        "- 点击左下角蓝色按钮使用 jq",
      ];
    }

    new PlaceholderContentWidget(this.editor, lines);
  }

  // 注册右键菜单项
  registerMenuItem(name, fnName, groupName, order, keybindings = []) {
    const item = {
      id: fnName,
      label: name,
      contextMenuGroupId: groupName,
      contextMenuOrder: order,
      keybindings: keybindings,
      run: () => {
        try {
          this[fnName]();
        } catch (e) {
          console.error(e);
        }
      },
    };

    // 用于删除 action
    item.disposable = this.editor.addAction(item);
    this.menuItems.set(fnName, item);
  }

  // TODO: 目前删除不了内置的菜单项
  // https://github.com/microsoft/monaco-editor/issues/1567#issuecomment-1404897422
  removeMenuItems() {
    const removableIDs = [
      "editor.action.changeAll",
      "editor.action.clipboardCopyAction",
      "editor.action.clipboardCutAction",
      "editor.action.clipboardPasteAction",
      "editor.action.formatDocument",
      "editor.action.jumpToBracket",
      "editor.action.peekDefinition",
      "editor.action.referenceSearch.trigger",
      "editor.action.revealDefinition",
      "editor.action.selectToBracket",
      'editor.action.changeAll',
      'editor.action.quickCommand',
    ];

    let menus = monacoActions.MenuRegistry._menuItems;
    menus = Array.from(menus, ([key, value]) => ({key, value}));
    const contextMenuEntry = menus.find(entry => entry?.key?.id === 'EditorContext');

    const removeByID = (list, ids) => {
      for (let node = list?._first; node; node = node.next) {
        const cmd = node.element?.command;

        if (cmd && ids.includes(cmd?.id)) {
          list._remove(node);
        }
      }
    };

    removeByID(contextMenuEntry?.value, removableIDs);
  }

  // 注册所有的右键菜单项
  registerMenuItems() {
    const register = (() => {
      let order = -100;
      return (name, fnName, groupName, keybindings = []) => {
        this.registerMenuItem(name, fnName, groupName, order++, keybindings);
      };
    })();

    register("上一个差异", "jumpToPrevDiff", "navigation", [editorApi.KeyMod.Alt | editorApi.KeyCode.KeyP]);
    register("下一个差异", "jumpToNextDiff", "navigation", [editorApi.KeyMod.Alt | editorApi.KeyCode.KeyN]);

    // 注册折叠菜单项
    for (let level = 2; level <= 7; level++) {
      this[`foldLevel${level}`] = () => this.editor.trigger("regionFold", `editor.foldLevel${level}`);
      register(`折叠层级${level}`, `foldLevel${level}`, "regionFold", [
        editorApi.KeyMod.Alt | (editorApi.KeyCode.Digit0 + level),
      ]);
    }

    // 注册展开折叠菜单项
    this.unfoldAll = () => this.editor.trigger("fold", "editor.unfoldAll");
    register("展开全部折叠区域", "unfoldAll", "regionFold", [editorApi.KeyMod.Alt | editorApi.KeyCode.Digit0]);
  }

  // 注册粘贴事件处理器
  registerOnPaste() {
    this.editor.onDidPaste((event) => {
      // 仅当粘贴替换全部文本时，才执行 paste 相关的动作
      if (!(event === null || event.range.equalsRange(this.model().getFullModelRange()))) {
        return;
      }

      this.onPaste();
    });
  }

  // 注册拖拽事件处理器，支持拖拽文件到编辑器上
  registerDropFileHandler() {
    this.editor.getDomNode().addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];

      if (file) {
        // 读取拖拽的文件内容，并设置为编辑器的内容
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          this.onPaste(text);
        };
        reader.readAsText(file);
      }
    });
  }

  // 宽度改变时自动展示或隐藏 minimap
  registerAutoShowMinimap() {
    const widthThreshold = 480;

    this.editor.onDidLayoutChange((e) => {
      const enabled = this.editor.getOption(editorApi.editor.EditorOption.minimap).enabled;
      const width = e.width;

      if (width > widthThreshold && !enabled) {
        this.editor.updateOptions({minimap: {enabled: true}});
      } else if (width < widthThreshold && enabled) {
        this.editor.updateOptions({minimap: {enabled: false}});
      }
    });
  }

  // 监听光标改变事件。显示光标停留位置的 json path
  registerDidFocus() {
    this.editor.onDidFocusEditorText(() => {
      this.dispatch(this.isLeft() ? setFocusLeft() : setFocusRight());
    });
  }

  // 监听光标改变事件。显示光标停留位置的 json path
  registerPositionChange() {
    this.editor.onDidChangeCursorPosition((e) => {
      const model = this.model();
      // 获取当前光标在整个文档中的偏移量（offset）
      const offset = model.getOffsetAt(e.position);
      const loc = jsonc.getLocation(this.text(), offset);
      const {lineNumber, column} = e.position;
      const selectionLength = model.getValueInRange(this.editor.getSelection()).length;

      const text = `${lineNumber}:${column}` + (selectionLength > 0 ? ` (${selectionLength} 个字符)` : "");
      this.setStatusBarText(text, StatusBarPos);

      if (loc.path) {
        this.setStatusBarText(pointer.toPointer(loc.path), StatusBarPath);
      }
    });
  }

  // 按住 alt 临时关闭同步滚动
  registerSuppressSyncScroll() {
    document.addEventListener("keydown", (event) => {
      if (event.altKey) {
        this.leftEditor.enableSyncScroll = false;
        this.rightEditor.enableSyncScroll = false;
        this.setStatusBarText("关闭同步滚动", StatusBarSetting);
      }
    });

    document.addEventListener("keyup", (event) => {
      // altKey 在 alt 按下时是 true，松开时是 false
      if (!event.altKey && event.key === "Alt") {
        this.leftEditor.enableSyncScroll = true;
        this.rightEditor.enableSyncScroll = true;
        this.setStatusBarText("", StatusBarSetting);
      }
    });
  }

  // 监听滚动事件实现同步滚动
  registerOnScroll() {
    const self = this;
    this.scrolling = 0;

    this.editor.onDidScrollChange((e) => {
      self.scrolling = Math.min(self.scrolling + 1, 1);

      if (self.scrollable() && self === self.leftEditor) {
        self.rightEditor?.scrollTo(e);
      } else if (self.scrollable() && self === self.rightEditor) {
        self.leftEditor?.scrollTo(e);
      }
    });
  }

  // 滚动到指定位置（类似鼠标滚动）
  scrollTo(e) {
    if (e.scrollTopChanged || e.scrollLeftChanged) {
      // 阻止下一次滚动
      this.scrolling = -1;
      const top = this.editor.getScrollTop();
      const left = this.editor.getScrollLeft();
      const absoluteTop = top + e.scrollTop - e._oldScrollTop;
      const absoluteLeft = left + e.scrollLeft - e._oldScrollLeft;
      this.editor.setScrollTop(absoluteTop);
      this.editor.setScrollLeft(absoluteLeft);
    }
  }

  // 可以滚动吗？
  scrollable() {
    return this.scrolling && this.enableSyncScroll;
  }

  /** 生成 JSON 解析错误时的提示文案
   * @param {ContextError[]} errors 包含上下文的错误
   * @returns {string}
   */
  genErrorAlert(errors) {
    if (!errors?.length) {
      return "";
    }

    const {offset, length, contextTexts} = errors[0];
    const {startLineNumber, startColumn} = this.range(offset, length);
    let [left, middle, right] = contextTexts;
    left = escape.escapeHTML(left);
    middle = escape.escapeHTML(middle);
    right = escape.escapeHTML(right);
    return `<red> ${startLineNumber} 行 ${startColumn} 列解析错误: ${left}<fg-red>${middle}</fg-red>${right}</red>`;
  }

  // 生成高亮的装饰
  newHighlightDecoration(range, inline, diffType) {
    if (inline) {
      return {
        range: range,
        options: {
          // 行内文本的装饰 class
          inlineClassName: color.getInlineClass(diffType),
        },
      };
    } else {
      return {
        range: range,
        // 示例：https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
        // 参数定义：https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDecorationOptions.html
        options: {
          // 高亮整行
          isWholeLine: true,
          // 整行文本的装饰 class
          className: color.getLineClass(diffType),
          marginClassName: color.getMarginClass(diffType),
          // 高亮右侧的 minimap
          minimap: {
            color: color.getMinimapColor(diffType),
            position: monaco.editor.MinimapPosition.Inline,
          },
          // 高亮 minimap 右侧的 overview ruler
          overviewRuler: {
            color: color.getOverviewRulerColor(diffType),
            position: monaco.editor.OverviewRulerLane.Full,
          },
        },
      };
    }
  }

  // 应用装饰
  applyDecorations(decorations) {
    this.clearDecorations();
    this.previousDecorations = this.editor.createDecorationsCollection(decorations);
  }

  // 清空装饰。NOTICE: 不能使用 model.getAllDecorations 全删了，会导致折叠按钮消失
  clearDecorations() {
    this.previousDecorations?.clear();
  }

  // 生成 diff 填充块
  applyViewZones(ranges) {
    const ids = [];

    this.editor.changeViewZones((changeAccessor) => {
      for (const {startLineNumber, endLineNumber} of ranges) {
        const id = changeAccessor.addZone({
          afterLineNumber: startLineNumber - 1,
          heightInLines: endLineNumber - startLineNumber + 1,
          domNode: this.genDiffFillDom(),
        });

        ids.push(id);
      }
    });

    return ids;
  }

  // 清除填充块
  clearViewZones() {
    const ids = this.diffResult.leftViewZoneIDs.concat(this.diffResult.rightViewZoneIDs);
    this.editor.changeViewZones((changeAccessor) => {
      for (const id of ids) {
        changeAccessor.removeZone(id);
      }
    });
  }

  // 生成 diff 填充块 dom 节点
  genDiffFillDom() {
    let node;

    if (typeof window != "undefined") {
      node = document.createElement("div");
      node.className = "diff-fill";
    }

    return node;
  }
}
