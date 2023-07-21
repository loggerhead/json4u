"use client";
import MyEditor from "../components/editor";
import MyButton from "../components/button";
import Dragbar from "../components/dragbar";
import styles from "./page.module.scss";
import { useRef } from "react";

export default function Home() {
  const editorContainerRef = useRef(null);

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
              <li className="flex">
                <MyButton>格式化</MyButton>
              </li>
              <li className="flex">
                <MyButton>最小化</MyButton>
              </li>
              <li className="flex">
                <MyButton>转义</MyButton>
              </li>
              <li className="flex">
                <MyButton>去转义</MyButton>
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
            <MyEditor name="leftEditor"></MyEditor>
          </div>
        </div>
        <Dragbar id="playground-dragbar" containerRef={editorContainerRef}></Dragbar>
        <div id="playground-sidecar" className="flex flex-col grow shrink min-w-fit gap-2">
          <div id="playground-plugin-tabbar">
            <MyButton>比较</MyButton>
          </div>
          <div className={styles.editor}>
            <MyEditor name="rightEditor"></MyEditor>
          </div>
        </div>
      </div>
    </div>
  );
}
