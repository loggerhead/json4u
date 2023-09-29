import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {loader} from "@monaco-editor/react";
import * as jsonc from "../jsonc-parser/main";
import * as color from "../color";
import {urlToJsonString} from "../url";
import * as format from "../format";
import * as pointer from "../pointer";
import * as compare from "../compare";
import * as parser from "../parser";
import * as escape from "../escape";
import PlaceholderContentWidget from "./placeholder-widget";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";

// NOTICE: 目前删除不了内置的右键菜单项：https://github.com/microsoft/monaco-editor/issues/1567
loader.config({monaco});

export class EditorRef {
  static StatusBarValidate = "r100"; // 虚拟状态栏 ID
  static StatusBarPos = "l1";
  static StatusBarPath = "l2";
  static StatusBarLeftValidate = "r1";
  static StatusBarRightValidate = "r2";
  static StatusBarSetting = "r3";
  static StatusBarCompare = "r4";
  static StatusBarDiff = "r5";

  constructor(editor, monaco, setStatusBar, adjustWidth) {
    // monaco editor 实例
    this.editor = editor;
    // monaco 实例
    this.monaco = monaco;
    // 设置编辑器下方状态栏文本
    this.setStatusBar = setStatusBar;
    this.setStatusBarBuf = {id: 0, tasks: {}};
    // 完成比较后，对两边编辑器的位置做调整
    this.adjustWidth = adjustWidth;
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
    this.editor.setSelection(new monaco.Range(0, 0, 0, 0));
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

  setStatusBarText(text, ...ids) {
    const o = {};
    // 计算需要展示的背景色
    const [_, colors] = color.matchColorTags(text);
    const prefixColor = color.max(colors);

    for (let id of ids) {
      let richText = text;

      // 需要生成前缀吗？
      if (id === EditorRef.StatusBarValidate) {
        id = this === this.leftEditor ? EditorRef.StatusBarLeftValidate : EditorRef.StatusBarRightValidate;

        if (text.trim().length) {
          const prefix = this === this.leftEditor ? "左侧" : "右侧";
          richText = `<${prefixColor}>${prefix}</${prefixColor}>${text}`;
        }
      }

      o[id] = text ? `<black>${richText}</black>` : "";
    }

    this.setStatusBarBuf.tasks = Object.assign(this.setStatusBarBuf.tasks, o);
    clearTimeout(this.setStatusBarBuf.id);

    this.setStatusBarBuf.id = setTimeout(() => {
      this?.setStatusBar(this.setStatusBarBuf.tasks);
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
      editor.setStatusBarText("", EditorRef.StatusBarDiff, EditorRef.StatusBarCompare);
      editor.diffResult = new compare.DiffResult([]);
    };

    if (this.leftEditor) {
      clear(this.leftEditor);
    }
    if (this.rightEditor) {
      clear(this.rightEditor);
    }
  }

  // 生成 monaco.Range
  range(offset, length) {
    const model = this.model();
    return monaco.Range.fromPositions(model.getPositionAt(offset), model.getPositionAt(offset + length));
  }

  // 校验 json valid
  validate() {
    if (this.text().trim().length) {
      const [node, errors] = parser.parseJSON(this.text());
      const errmsg = this.genErrorAlert(errors);
      this.setStatusBarText(errmsg, EditorRef.StatusBarValidate);
    } else {
      this.setStatusBarText("", EditorRef.StatusBarValidate);
    }
  }

  // 格式化
  format() {
    this.setText(format.format(this.text()));
  }

  // 最小化
  minify() {
    let text = this.text();
    const [node, errors] = parser.parseJSON(text);
    const errmsg = this.genErrorAlert(errors);

    if (errmsg) {
      this.setStatusBarText(errmsg, EditorRef.StatusBarValidate);
    }

    if (node?.length == text.length || !errors?.length) {
      text = node.stringify();
    } else {
      text = text.replace(/\s/g, "");
    }

    this.setText(text);
  }

  // 对 JSON 字符串做转义
  escape() {
    this.setText(escape.escapeJSON(this.text()));
  }

  // 对 JSON 字符串做反转义
  unescape() {
    this.setText(escape.unescapeJSON(this.text()));
  }

  // URL 转 JSON
  urlToJSON() {
    const text = urlToJsonString(this.text());
    this.setText(format.format(text));
  }

  // 对两侧文本做语义化比较
  compare(needTextCompare = false) {
    const ltext = this.leftEditor.text();
    const rtext = this.rightEditor.text();
    // 进行比较
    const dr = compare.smartCompare(ltext, rtext, needTextCompare);
    dr.genRanges(this.leftEditor, this.rightEditor);
    this.leftEditor.diffResult = dr;
    this.rightEditor.diffResult = dr;
    // 高亮 diff
    this.highlight();
    // 状态栏显示 diff 数量
    this.showResultMsg();
    // 滚动到第一个 diff
    this.leftEditor.jumpToDiff(0);
    this.rightEditor.jumpToDiff(0);
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
    const diffs = this === this.leftEditor ? this.diffResult.ldiffs : this.diffResult.rdiffs;
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
        this.setStatusBarText(`第 ${index + 1} 个差异`, EditorRef.StatusBarDiff);
      } else {
        this.setStatusBarText("", EditorRef.StatusBarDiff);
      }
    }, 100);
  }

  // 滚动到指定行
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

  // 将 python dict 转成 JSON
  pythonDict2JSON() {
    const text = this.text()
      .replace(/,\s*\}(\W*?)/gm, "}$1")
      .replace(/,\s*\](\W*?)/gm, "]$1")
      .replace(/(\W*?)'/gm, `$1"`)
      .replace(/'(\W*?)/gm, `"$1`)
      .replace(/\bTrue\b/gm, "true")
      .replace(/\bFalse\b/gm, "false")
      .replace(/\bNone\b/gm, "null");
    this.setText(format.format(text));
  }

  // 对 JSON 按 key 升序排序
  sort(reverse = false) {
    let text = this.text();
    const [tree, errors] = parser.parseJSON(text);
    const errmsg = this.genErrorAlert(errors);

    if (errmsg) {
      this.setStatusBarText(errmsg, EditorRef.StatusBarValidate);
    } else {
      text = tree.stringify(reverse ? "desc" : "asc");
      text = format.format(text);
      this.setText(text);
    }
  }

  // 对 JSON 按 key 降序排序
  sortReverse() {
    this.sort(true);
  }

  // 提示用户差异数量
  showResultMsg() {
    const msgs = [];
    const delN = this.diffResult.ldiffs.length;
    const insN = this.diffResult.rdiffs.length;

    if (this.diffResult.isTextCompare) {
      msgs.push("<blue>进行文本比较</blue>");
    }

    if (delN + insN === 0) {
      msgs.push("<black>两边没有差异</black>");
    } else {
      msgs.push(`<red>-${delN}</red> <green>+${insN}</green>`);
    }

    const msg = msgs.join("。");
    this.setStatusBarText(msg, EditorRef.StatusBarCompare);
  }

  // 高亮
  highlight() {
    // 生成 diff 块高亮和行内高亮
    const genDecorations = (type) => {
      const isLeft = type === compare.DEL;
      const editor = isLeft ? this.leftEditor : this.rightEditor;
      const ranges = [];

      this.diffResult.apply(isLeft, (d, inline) => {
        ranges.push(editor.newHighlightDecoration(d.range, inline, color.getColorClass(type, inline)));
      });

      return ranges;
    };

    const ldecorations = genDecorations(compare.DEL);
    const rdecorations = genDecorations(compare.INS);
    this.leftEditor.applyDecorations(ldecorations);
    this.rightEditor.applyDecorations(rdecorations);

    // 如果是文本比较，生成 diff 填充块
    if (this.diffResult.isTextCompare) {
      const [leftFills, rightFills] = compare.generateFillRanges(this.diffResult.hunkDiffs());
      this.diffResult.leftViewZoneIDs = this.leftEditor.applyViewZones(leftFills);
      this.diffResult.rightViewZoneIDs = this.rightEditor.applyViewZones(rightFills);
    }
  }

  // 粘贴时执行的动作
  onPaste(e = null) {
    // 仅当粘贴替换全部文本时，才执行 paste 相关的动作
    if (e === null || e.range.equalsRange(this.model().getFullModelRange())) {
      const now = performance.now();
      const text = format.tryFormat(this.text());
      this.setText(text);
      this.revealLine(1);

      // 如果是右侧编辑器粘贴文本
      if (this === this.rightEditor) {
        // 当左右两侧编辑器都不为空时，进行比较
        if (this.leftEditor?.text().length && this.rightEditor?.text().length) {
          this.compare();
        }

        // 展开右侧编辑器
        this.adjustWidth();
      }

      // 测量时间
      const cost = performance.now() - now;
      if (cost >= 100) {
        console.log(`paste ${text.length} chars cost: ${Math.round(cost)}ms`);
      }
    }
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
  }

  // 编辑器初始化
  init() {
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
    if (this === this.leftEditor) {
      lines = [
        "- 输入自动触发 JSON 校验",
        "- 支持拖拽上传文件",
        "- 粘贴自动触发格式化",
        "- Cmd+Z 撤销，复原成原始文本",
        "- 更多功能点击右键菜单",
      ];
    } else if (this === this.rightEditor) {
      lines = [
        "- 粘贴自动触发比较",
        "- 比较后触发左右窗口平分",
        "- 比较结果见右下方状态栏",
        "- 拖动左侧可调整窗口大小",
        "- 按住 Alt 键暂停同步滚动",
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

  // 注册所有的右键菜单项
  // NOTICE: 删除不了内置的菜单项：https://github.com/microsoft/monaco-editor/issues/1567
  registerMenuItems() {
    const register = (() => {
      let order = -100;
      return (name, fnName, groupName, keybindings = []) => {
        this.registerMenuItem(name, fnName, groupName, order++, keybindings);
      };
    })();

    register("上一个差异", "jumpToPrevDiff", "navigation", [monaco.KeyMod.Alt | monaco.KeyCode.KeyP]);
    register("下一个差异", "jumpToNextDiff", "navigation", [monaco.KeyMod.Alt | monaco.KeyCode.KeyN]);

    register("格式化", "format", "modification");
    register("最小化", "minify", "modification");
    register("转义", "escape", "modification");
    register("去转义", "unescape", "modification");
    register("排序（升序）", "sort", "modification");
    register("排序（降序）", "sortReverse", "modification");
    register("URL 转 JSON", "urlToJSON", "modification");
    register("Python Dict 转 JSON", "pythonDict2JSON", "modification");

    // 注册折叠菜单项
    for (let level = 2; level <= 7; level++) {
      this[`foldLevel${level}`] = () => this.editor.trigger("regionFold", `editor.foldLevel${level}`);
      register(`折叠层级${level}`, `foldLevel${level}`, "regionFold", [
        monaco.KeyMod.Alt | (monaco.KeyCode.Digit0 + level),
      ]);
    }

    // 注册展开折叠菜单项
    this.unfoldAll = () => this.editor.trigger("fold", "editor.unfoldAll");
    register("展开全部折叠区域", "unfoldAll", "regionFold", [monaco.KeyMod.Alt | monaco.KeyCode.Digit0]);
  }

  // 注册粘贴事件处理器
  registerOnPaste() {
    this.editor.onDidPaste((e) => this.onPaste(e));
  }

  // 注册拖拽事件处理器，支持拖拽文件到编辑器上
  registerDropFileHandler() {
    this.editor.getDomNode().addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];

      if (file) {
        // 读取拖拽的文件内容，并设置为编辑器的内容
        const reader = new FileReader();
        reader.onload = (e) => {
          this.editor.setValue(e.target.result);
          this.onPaste();
        };
        reader.readAsText(file);
      }
    });
  }

  // 宽度改变时自动展示或隐藏 minimap
  registerAutoShowMinimap() {
    const widthThreshold = 480;

    this.editor.onDidLayoutChange((e) => {
      const enabled = this.editor.getOption(monaco.editor.EditorOption.minimap).enabled;
      const width = e.width;

      if (width > widthThreshold && !enabled) {
        this.editor.updateOptions({
          minimap: {
            enabled: true,
          },
        });
      } else if (width < widthThreshold && enabled) {
        this.editor.updateOptions({
          minimap: {enabled: false},
        });
      }
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

      const text = `${lineNumber}:${column}` + (selectionLength > 0 ? ` (${selectionLength} chars)` : "");
      this.setStatusBarText(text, EditorRef.StatusBarPos);

      if (loc.path) {
        this.setStatusBarText(pointer.toPointer(loc.path), EditorRef.StatusBarPath);
      }
    });
  }

  // 按住 alt 临时关闭同步滚动
  registerSuppressSyncScroll() {
    document.addEventListener("keydown", (event) => {
      if (event.altKey) {
        this.leftEditor.enableSyncScroll = false;
        this.rightEditor.enableSyncScroll = false;
        this.setStatusBarText("关闭同步滚动", EditorRef.StatusBarSetting);
      }
    });

    document.addEventListener("keyup", (event) => {
      // altKey 在 alt 按下时是 true，松开时是 false
      if (!event.altKey && event.key === "Alt") {
        this.leftEditor.enableSyncScroll = true;
        this.rightEditor.enableSyncScroll = true;
        this.setStatusBarText("", EditorRef.StatusBarSetting);
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

  // 生成 JSON 解析错误时的提示文案
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
  newHighlightDecoration(range, inline, colorClass) {
    if (inline) {
      return {
        range: range,
        options: {
          // 行内文本的装饰 class
          inlineClassName: colorClass,
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
          className: color.getLineClass(colorClass),
          marginClassName: color.getMarginClass(colorClass),
          // 高亮右侧的 minimap
          minimap: {
            color: color.getMinimapColor(colorClass),
            position: monaco.editor.MinimapPosition.Inline,
          },
          // 高亮 minimap 右侧的 overview ruler
          overviewRuler: {
            color: color.getOverviewRulerColor(colorClass),
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
