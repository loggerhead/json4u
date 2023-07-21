"use client";
import MyEditor from "../components/editor";
import MyButton from "../components/button";
import Dragbar from "../components/dragbar";
import styles from "./page.module.scss";
import { useRef } from "react";

export default function Home() {
  const editorContainerRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);

  return (
    <div className="gap-2 mx-5 my-2">
      <div id="playground-container" className="flex">
        <div
          id="editor-container"
          ref={editorContainerRef}
          className="flex flex-col	shrink min-w-fit basis-9/12 relative gap-2"
        >
          <div id="editor-toolbar" className="flex relative justify-between	clear-both">
            <ul className="flex space-x-2">
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
            </ul>
            <ul className="flex right">
              <li>
                <a id="sidebar-toggle" href="#">
                  ⇥
                </a>
              </li>
            </ul>
          </div>
          <div className={styles.editor}>
            <MyEditor name="leftEditor" editorRef={leftEditorRef}></MyEditor>
          </div>
        </div>
        <Dragbar id="playground-dragbar" containerRef={editorContainerRef}></Dragbar>
        <div id="playground-sidecar" className="flex flex-col grow shrink min-w-fit gap-2">
          <div id="playground-plugin-tabbar">
            <MyButton>比较</MyButton>
          </div>
          <div className={styles.editor}>
            <MyEditor name="rightEditor" editorRef={rightEditorRef}></MyEditor>
          </div>
        </div>
      </div>
    </div>
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
