import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loader, Editor } from "@monaco-editor/react";
import * as jsonc from "../jsonc-parser/main";
import * as color from "../color";
import { urlToJsonString } from "../url";
import * as format from "../format";
import * as pointer from "../pointer";
import { semanticCompare, Diff, DEL, INS } from "../diff";
import * as parser from "../parser";
import PlaceholderContentWidget from "./placeholder-widget";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";

// NOTICE: 目前删除不了内置的右键菜单项：https://github.com/microsoft/monaco-editor/issues/1567
loader.config({ monaco });

export class EditorRef {
  constructor(editor, monaco, setAlert, setStatusText, adjustWidth) {
    // monaco editor 实例
    this.editor = editor;
    // monaco 实例
    this.monaco = monaco;
    // 设置编辑器上方的 alert 文本
    this.setAlert = setAlert;
    // 设置编辑器下方的 status bar 文本
    this.setStatusText = setStatusText;
    // 完成比较后，对两边编辑器的位置做调整
    this.adjustWidth = adjustWidth;
    // 滚动中吗？
    this.scrolling = false;
    // 启用同步滚动？
    this.enableSyncScroll = true;
    // 菜单项。key: value => 函数名: 菜单属性
    this.menuItems = new Map();
    // 比较后的差异（仅当前侧的差异）
    this.diffs = [];
    // 查看上一个差异或下一个差异时，记录的 diff 下标
    this.diffIndex = 0;
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
  setText(text, reset = true) {
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

    if (reset) {
      this.resetDiffDecorations();
    }
  }

  alert(text, isCompare = false) {
    if (text) {
      const reTag = /<\/?\w+>/g;
      // 计算需要展示的背景色
      const colors = [...text.matchAll(reTag)].map((tag) =>
        tag.toString().replace("<", "").replace(">", "").replace("/", "")
      );
      const tagColor = color.max(colors);
      // 将背景色 tag 全删除（保留高亮 tag）
      text = text.replace(reTag, "");
      // 生成前缀
      const prefix = isCompare ? "" : this === this.leftEditor ? "左侧" : "右侧";
      text = `<${tagColor}>${prefix}${text}</${tagColor}>`;
    }

    const editor = isCompare ? this.rightEditor : this.leftEditor;
    editor.setAlert(text);
  }

  setStatusBar(text, isStatus = false) {
    const editor = isStatus ? this.rightEditor : this.leftEditor;
    editor?.setStatusText(text);
  }

  // 重置 diff 高亮状态
  resetDiffDecorations() {
    this.clearDecorations();
    this.diffs = [];
    this.diffIndex = 0;
  }

  // 生成 monaco.Range
  range(offset, length) {
    const model = this.model();
    return monaco.Range.fromPositions(model.getPositionAt(offset), model.getPositionAt(offset + length));
  }

  // 校验 json valid
  validate() {
    const [node, errors] = parser.parseJSON(this.text());
    const errmsg = this.genErrorAlert(errors);
    this.alert(errmsg);
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
      this.alert(errmsg);
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
    const text = this.text()
      .replace(/[\\]/g, "\\\\")
      .replace(/[\"]/g, '\\"')
      .replace(/[\/]/g, "\\/")
      .replace(/[\b]/g, "\\b")
      .replace(/[\f]/g, "\\f")
      .replace(/[\n]/g, "\\n")
      .replace(/[\r]/g, "\\r")
      .replace(/[\t]/g, "\\t");
    this.setText(text);
  }

  // 对 JSON 字符串做反转义
  unescape() {
    const text = this.text()
      .replace(/[\\]n/g, "\n")
      .replace(/[\\]'/g, "'")
      .replace(/[\\]"/g, '"')
      .replace(/[\\]&/g, "&")
      .replace(/[\\]r/g, "\r")
      .replace(/[\\]t/g, "\t")
      .replace(/[\\]b/g, "\b")
      .replace(/[\\]f/g, "\f");
    this.setText(text);
  }

  // URL 转 JSON
  urlToJSON() {
    const text = urlToJsonString(this.text());
    this.setText(format.format(text));
  }

  // 对两侧文本做语义化比较
  compare() {
    const ltext = this.leftEditor.text();
    const rtext = this.rightEditor.text();

    // 进行比较
    let { diffs, isTextCompare, errors } = semanticCompare(ltext, rtext);
    const [delDiffs, insDiffs] = Diff.classify(diffs);
    this.leftEditor.diffs = delDiffs;
    this.rightEditor.diffs = insDiffs;

    // 高亮 diff
    this.showResultMsg(diffs, isTextCompare, errors);
    this.highlight(this.leftEditor, this.rightEditor, diffs);

    // 滚动到第一个 diff
    this.leftEditor.jumpToDiff(0);
    this.rightEditor.jumpToDiff(0);
  }

  // 跳转到上一个差异
  jumpToPrevDiff() {
    if (--this.diffIndex < 0) {
      this.diffIndex = this.diffs.length - 1;
    }
    this.jumpToDiff(this.diffIndex);
  }

  // 跳转到下一个差异
  jumpToNextDiff() {
    if (++this.diffIndex > this.diffs.length - 1) {
      this.diffIndex = 0;
    }
    this.jumpToDiff(this.diffIndex);
  }

  // 跳转到指定差异
  jumpToDiff(index) {
    const diff = this.diffs[index];

    if (diff) {
      const range = this.range(diff.offset, 1);
      const lineNumber = range.startLineNumber;
      this.revealLine(lineNumber);
      this.setStatusBar(`第${index + 1}个差异`, true);
    } else {
      this.setStatusBar("无差异", true);
    }
  }

  // 滚动到指定行
  revealLine(lineNumber) {
    // 禁用同步滚动
    const leftEnable = this.leftEditor.enableSyncScroll;
    const rightEnable = this.rightEditor.enableSyncScroll;
    this.leftEditor.enableSyncScroll = false;
    this.rightEditor.enableSyncScroll = false;

    this.editor.revealPositionInCenter({ lineNumber: lineNumber, column: 1 });

    this.leftEditor.enableSyncScroll = leftEnable;
    this.rightEditor.enableSyncScroll = rightEnable;
  }

  // 对 JSON 按 key 升序排序
  sort(reverse = false) {
    let text = this.text();
    const [tree, errors] = parser.parseJSON(text);
    const errmsg = this.genErrorAlert(errors);

    if (errmsg) {
      this.alert(errmsg);
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
  showResultMsg(diffs, isTextCompare, errors) {
    const errmsg = this.genErrorAlert(errors);
    if (errmsg) {
      this.alert(errmsg);
    }

    const msgs = [];

    if (isTextCompare) {
      msgs.push("<yellow>进行文本比较</yellow>");
    }

    if (diffs.length == 0) {
      msgs.push("<blue>两边没有差异</blue>");
    } else {
      const delN = diffs.filter((d) => d.type == DEL)?.length;
      const insN = diffs.filter((d) => d.type == INS)?.length;
      msgs.push(`<yellow>${delN} 删除，${insN} 新增</yellow>`);
    }

    const msg = msgs.join("。");
    this.alert(msg, true);
  }

  // 高亮
  highlight(leftEditor, rightEditor, diffs) {
    const leftDecorations = [];
    const rightDecorations = [];

    for (const { type, offset, length, highlightLine } of diffs) {
      const editor = type == DEL ? leftEditor : rightEditor;
      const decorations = type == DEL ? leftDecorations : rightDecorations;
      const colorClass = color.getColorClass(type, highlightLine);
      const dd = editor.newHighlightDecorations(offset, length, highlightLine, colorClass);
      decorations.push(...dd);
    }

    leftEditor.applyDecorations(leftDecorations);
    rightEditor.applyDecorations(rightDecorations);
  }

  // 粘贴时执行的动作
  onPaste(e = null) {
    // 仅当粘贴替换全部文本时，才执行 paste 相关的动作
    if (e === null || e.range.equalsRange(this.model().getFullModelRange())) {
      const now = new Date();
      const text = format.tryFormat(this.text());
      this.setText(text);

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
      const cost = new Date() - now;
      if (cost > 1000) {
        console.log(`paste ${text.length} chars cost: ${Math.floor(cost) / 1000}s`);
      }
    }
  }

  // 文本改变时执行的动作
  onChange() {
    this.clearDecorations();

    clearTimeout(this.timerID);
    this.timerID = setTimeout(() => {
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
    // 注入引用到编辑器，供 registerMenuItems 使用
    this.editor._ref = this;
    this.registerOnPaste();
    this.registerAutoShowMinimap();
    this.registerDropFileHandler();
    this.registerPositionChange();
    this.registerOnFocus();
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
        "- 拖动左侧可调整窗口大小",
        "- 按住 Ctrl 暂停同步滚动",
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
      // 只能通过引用来调用，否则不生效
      run: function (ed) {
        try {
          ed._ref[fnName]();
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
    register("URL转JSON", "urlToJSON", "modification");
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
          minimap: { enabled: false },
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

      if (loc.path) {
        this.setStatusBar(pointer.toPointer(loc.path));
      }
    });
  }

  // 监听 focus 事件以支持同步滚动
  registerOnFocus() {
    const self = this;

    this.editor.onDidFocusEditorText((e) => {
      self.scrolling = true;

      if (self === self.leftEditor && self.rightEditor) {
        self.rightEditor.scrolling = false;
      } else if (self === self.rightEditor && self.leftEditor) {
        self.leftEditor.scrolling = false;
      }
    });
  }

  // 监听滚动事件实现同步滚动
  registerOnScroll() {
    const self = this;

    this.editor.onDidScrollChange((e) => {
      if (self.scrollable() && self === self.leftEditor) {
        self.rightEditor?.scrollTo(e);
      } else if (self.scrollable() && self === self.rightEditor) {
        self.leftEditor?.scrollTo(e);
      }
    });
  }

  // 按住 ctrl 临时关闭同步滚动
  registerSuppressSyncScroll() {
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey) {
        this.leftEditor.enableSyncScroll = false;
        this.rightEditor.enableSyncScroll = false;
        this.setStatusBar("关闭同步滚动", true);
      }
    });

    document.addEventListener("keyup", (event) => {
      // ctrlKey 在 ctrl 按下时是 true，松开时是 false
      if (!event.ctrlKey && event.key === "Control") {
        this.leftEditor.enableSyncScroll = true;
        this.rightEditor.enableSyncScroll = true;
        this.setStatusBar("", true);
      }
    });
  }

  // 滚动到指定位置（类似鼠标滚动）
  scrollTo(e) {
    if (e.scrollTopChanged || e.scrollLeftChanged) {
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

    const { offset, length, contextTexts } = errors[0];
    const [left, middle, right] = contextTexts;
    const { startLineNumber, startColumn } = this.range(offset, length);
    return `<red>${startLineNumber}行${startColumn}列解析错误: ${left}<hl-red>${middle}</hl-red>${right}</red>`;
  }

  // 生成高亮的装饰
  newHighlightDecorations(offset, length, highlightLine, colorClass) {
    const model = this.model();
    // 从偏移量和长度生成 Range 对象
    const range = this.range(offset, length);
    // 示例：https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
    // 参数定义：https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDecorationOptions.html
    const options = {
      // 高亮整行
      isWholeLine: true,
      // 整行文本的装饰 class
      className: color.getLineColorClass(colorClass),
      // 高亮右侧的 minimap
      minimap: {
        // monaco bug: color 参数不生效
        color: color.getMinimapColor(colorClass),
        // monaco bug: Inline 枚举下 minimap 内容不准确
        position: monaco.editor.MinimapPosition.Gutter,
      },
      // 高亮 minimap 右侧的 overview ruler
      overviewRuler: {
        color: color.getOverviewRulerColor(colorClass),
        position: monaco.editor.OverviewRulerLane.Full,
      },
    };

    const decorations = [
      {
        range: range,
        options: options,
      },
    ];

    if (!highlightLine) {
      decorations.push({
        range: range,
        options: {
          // 行内文本的装饰 class
          inlineClassName: colorClass,
        },
      });
    }

    return decorations;
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
}
