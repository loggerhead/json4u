"use client";
import { useRef, useState } from "react";
import styles from "./page.module.scss";
import MyEditor from "../components/editor";
import MyButton from "../components/button";
import MyAlert from "../components/alert";
import Dragbar from "../components/dragbar";
import { semanticCompare, DEL, INS } from "../lib/diff";
import * as color from "../lib/color";

export default function Home() {
  const [hidden, setHidden] = useState(false);
  const [leftAlert, setLeftAlert] = useState({ msg: "", color: "" });
  const [rightAlert, setRightAlert] = useState({ msg: "", color: "" });
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);

  // 将左右两侧编辑器平分
  const halfLeftEditor = () => {
    leftContainerRef.current.style.flexBasis = "50%";
    rightContainerRef.current.style.display = "";
  };

  // 隐藏右侧编辑器
  const hiddenRightEditor = () => {
    leftContainerRef.current.style.flexBasis = "100%";
    rightContainerRef.current.style.display = "none";
  };

  const toggle = (hidden) => {
    const nextState = !hidden;

    if (nextState) {
      hiddenRightEditor();
    } else {
      halfLeftEditor();
    }

    return nextState;
  };

  return (
    <div className="gap-2 mx-5 my-2">
      <div className="flex">
        <div ref={leftContainerRef} className="flex flex-col shrink min-w-fit basis-9/12 relative gap-2">
          <div className="flex relative justify-between	clear-both">
            <ul className="flex space-x-2 items-center">
              <li>
                <FormatButton editorRef={leftEditorRef}></FormatButton>
              </li>
              <li>
                <MinifyButton editorRef={leftEditorRef}></MinifyButton>
              </li>
              <li>
                <EscapeButton editorRef={leftEditorRef}></EscapeButton>
              </li>
              <li>
                <UnescapeButton editorRef={leftEditorRef}></UnescapeButton>
              </li>
              <li>
                <MyAlert props={leftAlert}></MyAlert>
              </li>
            </ul>
            <ul className="flex right">
              <li>
                <SidebarToggler hidden={hidden} setHidden={setHidden} toggle={toggle}></SidebarToggler>
              </li>
            </ul>
          </div>
          <div className={styles.editor}>
            <MyEditor name="leftEditor" editorRef={leftEditorRef} setAlert={setLeftAlert}></MyEditor>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="invisible h-6 my-px"></div>
          <Dragbar containerRef={leftContainerRef} className={hidden ? "hidden" : ""}></Dragbar>
        </div>
        <div ref={rightContainerRef} className="flex flex-col grow shrink min-w-fit gap-2">
          <ul className="flex space-x-2 items-center">
            <li>
              <CompareButton
                leftEditorRef={leftEditorRef}
                rightEditorRef={rightEditorRef}
                setAlert={setRightAlert}
                halfLeftEditor={halfLeftEditor}
              ></CompareButton>
            </li>
            <li>
              <MyAlert props={rightAlert}></MyAlert>
            </li>
          </ul>
          <div className={styles.editor}>
            <MyEditor name="rightEditor" editorRef={rightEditorRef} setAlert={setRightAlert}></MyEditor>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarToggler({ hidden, setHidden, toggle }) {
  return (
    <a href="#" onClick={() => setHidden(toggle)}>
      {hidden ? "⇤" : "⇥"}
    </a>
  );
}

function FormatButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.format()}>格式化</MyButton>;
}

function MinifyButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.minify()}>最小化</MyButton>;
}

function EscapeButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.escape()}>转义</MyButton>;
}

function UnescapeButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.unescape()}>去转义</MyButton>;
}

function CompareButton({ leftEditorRef, rightEditorRef, setAlert, halfLeftEditor }) {
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
    halfLeftEditor();
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
