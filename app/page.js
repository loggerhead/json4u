"use client";

import dynamic from "next/dynamic";
const MyEditor = dynamic(() => import("../components/editor"), { ssr: false });

import { useRef, useState } from "react";
import styles from "./page.module.scss";
import MyAlert from "../components/alert";
import Dragbar from "../components/dragbar";
import { FormatButton, MinifyButton, EscapeButton, UnescapeButton } from "../components/button";
import CompareButton from "../components/compare-button";
import Toggler from "../components/toggler";

export default function Home() {
  const [hidden, setHidden] = useState(0);
  const [leftAlert, setLeftAlert] = useState({ msg: "", color: "" });
  const [rightAlert, setRightAlert] = useState({ msg: "", color: "" });
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);

  return (
    <div className="gap-2 mx-5 my-2">
      <div className="flex">
        <div
          ref={leftContainerRef}
          className={`flex flex-col shrink min-w-fit relative gap-2 ${
            hidden === 0 ? "basis-9/12" : hidden ? "basis-full" : "basis-1/2"
          }`}
        >
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
                <Toggler
                  hidden={hidden}
                  onClick={() => {
                    leftContainerRef.current.style.flexBasis = "";
                    setHidden(!hidden);
                  }}
                ></Toggler>
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
        <div ref={rightContainerRef} className={`flex flex-col grow shrink min-w-fit gap-2 ${hidden ? "hidden" : ""}`}>
          <ul className="flex space-x-2 items-center">
            <li>
              <CompareButton
                leftEditorRef={leftEditorRef}
                rightEditorRef={rightEditorRef}
                setAlert={setRightAlert}
                setHidden={setHidden}
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
