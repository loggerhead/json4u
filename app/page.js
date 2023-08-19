"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import MyAlert from "../components/alert";
import Dragbar from "../components/dragbar";
import Toggler from "../components/toggler";
import Loading from "../components/loading";
import StatusBar from "../components/statusbar";
import { FormatButton, MinifyButton, EscapeButton, UnescapeButton, CompareButton } from "../components/button";

const editorHeight = "calc(100vh - 6rem)";

const MyEditor = dynamic(() => import("../components/editor"), {
  ssr: false,
  loading: () => <Loading height={editorHeight}></Loading>,
});

export default function Home() {
  const [hidden, setHidden] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [leftAlert, setLeftAlert] = useState("");
  const [rightAlert, setRightAlert] = useState("");
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);

  // 当左右两侧编辑器都完成初始化后，将两者关联
  const pair = () => {
    if (leftEditorRef.current && rightEditorRef.current) {
      leftEditorRef.current.pair(leftEditorRef.current, rightEditorRef.current);
      rightEditorRef.current.pair(leftEditorRef.current, rightEditorRef.current);
    }
  };

  return (
    <div className="gap-2 mx-5 mt-2">
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
                <MyAlert richText={leftAlert}></MyAlert>
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
          <div className="border border-solid border-color">
            <MyEditor
              height={editorHeight}
              editorRef={leftEditorRef}
              setAlert={setLeftAlert}
              setStatusText={setStatusText}
              adjustWidth={() => setHidden(false)}
              doPair={pair}
            ></MyEditor>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="invisible h-6 my-px"></div>
          <Dragbar containerRef={leftContainerRef} className={hidden ? "hidden" : ""}></Dragbar>
        </div>
        <div ref={rightContainerRef} className={`flex flex-col grow shrink min-w-fit gap-2 ${hidden ? "hidden" : ""}`}>
          <ul className="flex space-x-2 items-center">
            <li>
              <CompareButton editorRef={rightEditorRef}></CompareButton>
            </li>
            <li>
              <MyAlert richText={rightAlert}></MyAlert>
            </li>
          </ul>
          <div className="border border-solid border-color">
            <MyEditor
              height={editorHeight}
              editorRef={rightEditorRef}
              setAlert={setRightAlert}
              setStatusText={setStatusText}
              adjustWidth={() => setHidden(false)}
              doPair={pair}
            ></MyEditor>
          </div>
        </div>
      </div>
      <StatusBar>{statusText}</StatusBar>
    </div>
  );
}
