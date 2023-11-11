"use client";
import dynamic from "next/dynamic";
import {useEffect, useRef, useState} from "react";
import "@arco-design/web-react/dist/css/arco.css";
import Dragbar from "../components/dragbar";
import Toggler from "../components/toggler";
import Loading from "../components/loading";
import StatusBar from "../components/statusbar";
import Switch from "../components/switch";
import {
  CompareButton,
  EscapeButton,
  FormatButton,
  MinifyButton,
  TextCompareAfterSortButton,
  UnescapeButton,
} from "../components/button";
import version from "../lib/version";

const editorHeight = "calc(100vh - 6rem)";

const MyEditor = dynamic(() => import("../components/editor"), {
  ssr: false,
  loading: () => <Loading height={editorHeight}></Loading>,
});

export default function Home() {
  const [hidden, setHidden] = useState(0);
  const [statusBar, setStatusBar] = useState({});
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);
  const enableAutoFormatRef = useRef(true);

  // 当左右两侧编辑器都完成初始化后，将两者关联
  const pair = () => {
    if (leftEditorRef.current && rightEditorRef.current) {
      leftEditorRef.current.pair(leftEditorRef.current, rightEditorRef.current);
      rightEditorRef.current.pair(leftEditorRef.current, rightEditorRef.current);
    }
  };

  useEffect(() => {
    console.log(`JSON For You 当前版本：${version}`);
  }, []);

  return (
    <div className="gap-2 mx-5 mt-2">
      <div className="flex">
        <div
          ref={leftContainerRef}
          className={`flex flex-col shrink min-w-fit relative gap-2 ${
            hidden === 0 ? "basis-1/2 md:basis-8/12" : hidden ? "basis-full" : "basis-1/2"
          }`}
        >
          <div className="flex relative justify-between	clear-both">
            <ul className="flex space-x-2 items-center">
              <li>
                <FormatButton leftEditorRef={leftEditorRef} rightEditorRef={rightEditorRef}></FormatButton>
              </li>
              <li>
                <MinifyButton leftEditorRef={leftEditorRef} rightEditorRef={rightEditorRef}></MinifyButton>
              </li>
              <li>
                <EscapeButton leftEditorRef={leftEditorRef} rightEditorRef={rightEditorRef}></EscapeButton>
              </li>
              <li>
                <UnescapeButton leftEditorRef={leftEditorRef} rightEditorRef={rightEditorRef}></UnescapeButton>
              </li>
              <li>
                <Switch text={"自动格式化"} onCheck={(checked) => enableAutoFormatRef.current = checked}></Switch>
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
              setStatusBar={setStatusBar}
              enableAutoFormatRef={enableAutoFormatRef}
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
              <TextCompareAfterSortButton leftEditorRef={leftEditorRef}
                                          rightEditorRef={rightEditorRef}></TextCompareAfterSortButton>
            </li>
          </ul>
          <div className="border border-solid border-color">
            <MyEditor
              height={editorHeight}
              editorRef={rightEditorRef}
              setStatusBar={setStatusBar}
              enableAutoFormatRef={enableAutoFormatRef}
              adjustWidth={() => setHidden(false)}
              doPair={pair}
            ></MyEditor>
          </div>
        </div>
      </div>
      <StatusBar texts={statusBar}></StatusBar>
    </div>
  );
}
