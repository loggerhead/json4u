"use client";
import "@arco-design/web-react/dist/css/arco.css";
import dynamic from "next/dynamic";
import {useMemo, useRef} from "react";
import {useDispatch, useSelector} from 'react-redux';
import * as Sentry from "@sentry/react";
import Dragbar from "../components/dragbar";
import Toggler from "../components/toggler";
import Loading from "../components/loading";
import StatusBar from "../components/statusBar";
import {FormatSwitch, NestParseSwitch, SortSwitch} from "@/components/switch";
import {CompareButton, FormatButton, MinifyButton, TextCompareAfterSortButton} from "@/components/button";
import {LeftMenu} from "@/components/menu";
import version from "../lib/version";
import {setWorker, switchHideRightEditor} from '@/features/ctxSlice';
import {Message} from "@arco-design/web-react";

const editorHeight = "calc(100vh - 6rem)";

const MyEditor = dynamic(() => import("../components/editor"), {
  ssr: false,
  loading: () => <Loading height={editorHeight}></Loading>,
});

function useInit({dispatch, initTimers}) {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 从 local storage 读默认配置
    dispatch({type: "ctx/setSettings", payload: localStorage.getItem('settings')});
    console.log(`JSON For You 当前版本：${version}`);

    initTimers.current.push(setTimeout(() => {
      Message.warning("编辑器加载过慢，建议清除页面缓存后重试");
    }, 5000));

    const worker = new Worker(new URL('../lib/worker.js', import.meta.url));
    dispatch(setWorker(worker));
    // TODO: 关闭 worker
    return () => worker.terminate();
  }, []);
}

export default function Home() {
  const ctx = useSelector((state) => state.ctx);
  const dispatch = useDispatch();
  const leftContainerRef = useRef(null);
  const initTimers = useRef([]);

  useInit({dispatch, initTimers});

  return (
    <Sentry.ErrorBoundary>
      <div className="gap-2 mx-5 mt-2">
        <div className="flex">
          <div
            ref={leftContainerRef}
            className={`flex flex-col shrink min-w-fit relative gap-2 ${
              ctx.hideRightEditor === 0 ? "basis-1/2 md:basis-8/12" : ctx.hideRightEditor ? "basis-full" : "basis-1/2"
            }`}
          >
            <div className="flex relative justify-between	clear-both">
              <ul className="flex space-x-2 items-center">
                <li><FormatButton></FormatButton></li>
                <li><MinifyButton></MinifyButton></li>
                <li><LeftMenu></LeftMenu></li>
                <li><FormatSwitch></FormatSwitch></li>
                <li><SortSwitch></SortSwitch></li>
                <li><NestParseSwitch></NestParseSwitch></li>
              </ul>
              <ul className="flex right">
                <li>
                  <Toggler
                    hidden={ctx.hideRightEditor}
                    onClick={() => {
                      leftContainerRef.current.style.flexBasis = "";
                      dispatch(switchHideRightEditor());
                    }}
                  ></Toggler>
                </li>
              </ul>
            </div>
            <div className={`border border-solid ${ctx.focusLeft ? "border-active" : "border-color"}`}>
              <MyEditor name="left" timers={initTimers} height={editorHeight}></MyEditor>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="invisible h-6 my-px"></div>
            <Dragbar containerRef={leftContainerRef} className={ctx.hideRightEditor ? "hidden" : ""}></Dragbar>
          </div>
          <div className={`flex flex-col grow shrink min-w-fit gap-2 ${ctx.hideRightEditor ? "hidden" : ""}`}>
            <ul className="flex space-x-2 items-center">
              <li>
                <CompareButton></CompareButton>
              </li>
              <li>
                <TextCompareAfterSortButton></TextCompareAfterSortButton>
              </li>
            </ul>
            <div className={`border border-solid ${ctx.focusLeft ? "border-color" : "border-active"}`}>
              <MyEditor name="right" timers={initTimers} height={editorHeight}></MyEditor>
            </div>
          </div>
        </div>
        <StatusBar></StatusBar>
      </div>
    </Sentry.ErrorBoundary>
  );
}
