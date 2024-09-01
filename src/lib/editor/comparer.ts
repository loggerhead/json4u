import type { Diff, DiffPair, DiffType, Range } from "@/lib/compare";
import { newRange } from "@/lib/compare";
import { getStatusState } from "@/stores/statusStore";
import { getInlineClass, getLineClass, getMarginClass, getMinimapColor, getOverviewRulerColor } from "./color";
import type { EditorWrapper, Kind } from "./editor";
import { editorApi } from "./types";

export class Comparer {
  main: EditorWrapper;
  secondary: EditorWrapper;
  leftDecorations?: editorApi.IEditorDecorationsCollection;
  rightDecorations?: editorApi.IEditorDecorationsCollection;
  leftBlankHunkIDs?: string[];
  rightBlankHunkIDs?: string[];

  constructor(main: EditorWrapper, secondary: EditorWrapper) {
    this.main = main;
    this.secondary = secondary;
    this.main.listenOnScroll();
    this.secondary.listenOnScroll();
  }

  worker() {
    return this.main.worker();
  }

  enableTextCompare() {
    return getStatusState().enableTextCompare;
  }

  monacoEditor(kind: Kind) {
    return (kind === "main" ? this.main : this.secondary).editor;
  }

  async compare() {
    const isTextCompare = this.enableTextCompare() || !(this.main.isTreeValid() && this.secondary.isTreeValid());
    const diffPairs = isTextCompare
      ? await this.worker().compareText(this.main.text(), this.secondary.text())
      : await this.worker().compareTree(this.main.tree, this.secondary.tree);
    return { diffPairs, isTextCompare };
  }

  highlightDiff(diffPairs: DiffPair[], isTextCompare: boolean) {
    this.reset();
    this.genRanges(diffPairs);

    // 高亮 diff
    const decorations = genHighlightDecorations(diffPairs);
    this.applyDecorations(decorations);
    isTextCompare && this.fillBlankHunkDoms(diffPairs);

    // 滚动到第一个 diff pair
    const hasDiff = diffPairs.length > 0;
    if (hasDiff) {
      const { left, right } = diffPairs[0];
      left && this.main.revealOffset(left.offset);
      right && this.secondary.revealOffset(right.offset);
    }
  }

  // 计算 diff 在 editor 中的 range，生成区域
  genRanges(diffPairs: DiffPair[]) {
    const newRangeFromDiff = (editor: EditorWrapper, diff: Diff) => {
      const range: Range = {
        ...editor.range(diff.offset, diff.length),
        ...diff,
      };

      // 如果区域长度为 1 并且列号都为 1，说明只有一个换行符，此时校准一下，避免高亮展示到下一行
      if (range.length === 1 && range.startColumn === 1 && range.endColumn === 1) {
        range.endLineNumber = range.startLineNumber;
      }
      return range;
    };

    diffPairs.forEach(({ left, right }) => {
      if (left) {
        left.range = newRangeFromDiff(this.main, left);
        left.inlineDiffs?.forEach((d) => {
          d.range = newRangeFromDiff(this.main, d);
        });
      }

      if (right) {
        right.range = newRangeFromDiff(this.secondary, right);
        right.inlineDiffs?.forEach((d) => {
          d.range = newRangeFromDiff(this.secondary, d);
        });
      }
    });
  }

  // 应用装饰
  applyDecorations({ left, right }: { left: Decoration[]; right: Decoration[] }) {
    this.leftDecorations = this.monacoEditor("main").createDecorationsCollection(left);
    this.rightDecorations = this.monacoEditor("secondary").createDecorationsCollection(right);
  }

  // 如果是对文本比较的结果进行高亮，则需要在相交的两个 diff 上生成空白块做填充，让左右两侧的 diff 看上去一样高
  fillBlankHunkDoms(diffPairs: DiffPair[]) {
    const applyViewZones = (kind: Kind, ranges: Range[]) => {
      let ids: string[] = [];

      this.monacoEditor(kind).changeViewZones((changeAccessor) => {
        ids = ranges.map(({ startLineNumber, endLineNumber }) =>
          changeAccessor.addZone({
            afterLineNumber: startLineNumber - 1,
            heightInLines: endLineNumber - startLineNumber + 1,
            domNode: genBlankHunkDom(),
          }),
        );
      });

      return ids;
    };

    const { left, right } = genFillRanges(diffPairs);
    this.leftBlankHunkIDs = applyViewZones("main", left);
    this.rightBlankHunkIDs = applyViewZones("secondary", right);
  }

  reset() {
    // NOTICE: 不能使用 model.getAllDecorations 全删了，会导致折叠按钮消失
    this.leftDecorations?.clear();
    this.rightDecorations?.clear();

    this.monacoEditor("main").changeViewZones((changeAccessor) => {
      for (const id of this.leftBlankHunkIDs ?? []) {
        changeAccessor.removeZone(id);
      }
    });
    this.monacoEditor("secondary").changeViewZones((changeAccessor) => {
      for (const id of this.rightBlankHunkIDs ?? []) {
        changeAccessor.removeZone(id);
      }
    });

    delete this.leftDecorations;
    delete this.rightDecorations;
    delete this.leftBlankHunkIDs;
    delete this.rightBlankHunkIDs;
  }
}

// 生成填充块的 ranges
function genFillRanges(pairs: DiffPair[]): { left: Range[]; right: Range[] } {
  const leftRanges: Range[] = [];
  const rightRanges: Range[] = [];
  // laggr: 填充块填充的累积行数
  let lAggr = 0;
  let rAggr = 0;

  const addLeftFill = (fill: Range) => {
    leftRanges.push(rangeMinus(fill, lAggr));
    lAggr += countRange(fill);
  };
  const addRightFill = (fill: Range) => {
    rightRanges.push(rangeMinus(fill, rAggr));
    rAggr += countRange(fill);
  };

  // 需要多遍历一次，处理最后一个 last
  for (const { left, right } of pairs) {
    const lStart = left?.range?.startLineNumber ?? 0;
    const lEnd = left?.range?.endLineNumber ?? 0;
    const rStart = right?.range?.startLineNumber ?? 0;
    const rEnd = right?.range?.endLineNumber ?? 0;
    const lFillStart = left ? lStart + lAggr : 0;
    const lFillEnd = left ? lEnd + lAggr : 0;
    const rFillStart = right ? rStart + rAggr : 0;
    const rFillEnd = right ? rEnd + rAggr : 0;

    // 如果两者不重合
    if (lFillEnd < rFillStart || rFillEnd < lFillStart) {
      if (left) {
        addRightFill(newRange(lStart + lAggr, lEnd + lAggr));
      }
      if (right) {
        addLeftFill(newRange(rStart + rAggr, rEnd + rAggr));
      }
    } else {
      // 注意：因为 ls === rs 恒成立，所以永远是在下方填充
      if (lFillEnd <= rFillEnd) {
        addLeftFill(newRange(Math.max(lFillEnd + 1, rFillStart), rFillEnd));
      } else if (rFillEnd < lFillEnd) {
        addRightFill(newRange(Math.max(rFillEnd + 1, lFillStart), lFillEnd));
      }
    }
  }

  return { left: leftRanges, right: rightRanges };
}

function genBlankHunkDom() {
  const node = document.createElement("div");
  node.className = "blank-hunk";
  return node;
}

// 生成 diff 块高亮和行内高亮
function genHighlightDecorations(diffPairs: DiffPair[]): { left: Decoration[]; right: Decoration[] } {
  const leftDecorations: Decoration[] = [];
  const rightDecorations: Decoration[] = [];

  for (const { left, right } of diffPairs) {
    const { hunk: leftHunk, inlines: leftInlines } = genDecorations(left);
    const { hunk: rightHunk, inlines: rightInlines } = genDecorations(right);

    leftHunk && leftDecorations.push(leftHunk);
    rightHunk && rightDecorations.push(rightHunk);
    leftInlines.length > 0 && leftDecorations.push(...leftInlines);
    rightInlines.length > 0 && rightDecorations.push(...rightInlines);
  }

  return { left: leftDecorations, right: rightDecorations };
}

function genDecorations(diff: Diff | undefined): { hunk?: Decoration; inlines: Decoration[] } {
  if (!diff) {
    return { inlines: [] };
  }

  const type = diff.type;
  const hunk = newDecoration(diff.range!, false, type);
  const inlines = diff.inlineDiffs?.map((d) => newDecoration(d.range!, true, type)) ?? [];
  return { hunk, inlines };
}

interface Decoration {
  range: Range;
  // 示例：https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
  // 参数定义：https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDecorationOptions.html
  options: editorApi.IModelDecorationOptions;
}

// 生成高亮的装饰
function newDecoration(range: Range, isInlineDiff: boolean, diffType: DiffType): Decoration {
  if (isInlineDiff) {
    return {
      range: range,
      options: {
        // 行内文本的装饰 class
        inlineClassName: getInlineClass(diffType),
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
        className: getLineClass(diffType),
        marginClassName: getMarginClass(diffType),
        // 高亮右侧的 minimap
        minimap: {
          color: getMinimapColor(diffType),
          position: window.monacoApi.MinimapPosition.Inline,
        },
        // 高亮 minimap 右侧的 overview ruler
        overviewRuler: {
          color: getOverviewRulerColor(diffType),
          position: window.monacoApi.OverviewRulerLane.Full,
        },
      },
    };
  }
}

function rangeMinus(range: Range, n: number) {
  return { ...range, startLineNumber: range.startLineNumber - n, endLineNumber: range.endLineNumber - n };
}

function countRange(range: Range) {
  return range.endLineNumber > 0 ? range.endLineNumber - range.startLineNumber + 1 : 0;
}
