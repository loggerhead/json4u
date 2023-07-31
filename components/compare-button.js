"use client";
import MyButton from "./button";
import { semanticCompare, DEL, INS } from "../lib/diff";
import * as color from "../lib/color";

export default function CompareButton({ leftEditorRef, rightEditorRef, setAlert, setHidden }) {
  const compare = () => {
    const leftEditor = leftEditorRef.current;
    const rightEditor = rightEditorRef.current;
    const ltext = leftEditor.text();
    const rtext = rightEditor.text();

    // 进行比较
    let { diffs, isTextCompare } = semanticCompare(ltext, rtext);
    diffs = diffs.filter((d) => d.diffType == DEL || d.diffType == INS);

    if (isTextCompare) {
      adjustForHighlight(diffs);
    }

    showResultMsg(diffs, isTextCompare);
    highlight(diffs);
    setHidden(false);
  };

  // 提示用户差异数量
  const showResultMsg = (diffs, isTextCompare) => {
    let msgs = [];
    let colors = [];

    if (isTextCompare) {
      msgs.push("无效 JSON，进行文本比较。");
      colors.push("yellow");
    }

    if (diffs.length == 0) {
      msgs.push("两边没有差异");
      colors.push("green");
    } else {
      const delN = diffs.filter((d) => d.diffType == DEL)?.length;
      const insN = diffs.filter((d) => d.diffType == INS)?.length;
      msgs.push(`${delN} 删除，${insN} 新增`);
      colors.push("blue");
    }

    const msg = msgs.join(" ");
    const c = color.max(colors);
    setAlert({ msg: msg, color: c });
  };

  // 调整 diff 以便高亮
  const adjustForHighlight = (diffs) => {
    const leftEditor = leftEditorRef.current;
    const rightEditor = rightEditorRef.current;

    for (const diff of diffs) {
      const editor = diff.diffType == DEL ? leftEditor : rightEditor;
      const range = editor.range(diff.offset, diff.length);
      const text = editor.model().getValueInRange(range);

      // 末尾换行符不进行高亮，避免接下来一行没有差异但被高亮
      if (text.endsWith("\n")) {
        diff.length--;
      }
    }
  };

  // 高亮
  const highlight = (diffs) => {
    const leftEditor = leftEditorRef.current;
    const rightEditor = rightEditorRef.current;
    const leftDecorations = [];
    const rightDecorations = [];

    for (const { diffType, offset, length, highlightLine } of diffs) {
      const editor = diffType == DEL ? leftEditor : rightEditor;
      const decorations = diffType == DEL ? leftDecorations : rightDecorations;
      const colorClass = color.getColorClass(diffType, highlightLine);
      const dd = editor.newHighlightDecorations(offset, length, highlightLine, colorClass);
      decorations.push(...dd);
    }

    leftEditor.applyDecorations(leftDecorations);
    rightEditor.applyDecorations(rightDecorations);
  };

  return <MyButton onClick={compare}>比较</MyButton>;
}
