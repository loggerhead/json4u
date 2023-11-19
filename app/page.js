"use client";
import dynamic from "next/dynamic";
import {useEffect, useRef} from "react";
import {useDispatch, useSelector} from 'react-redux';
import "@arco-design/web-react/dist/css/arco.css";
import Dragbar from "../components/dragbar";
import Toggler from "../components/toggler";
import Loading from "../components/loading";
import StatusBar from "../components/statusbar";
import Switch from "../components/switch";
import {
  CompareButton,
  FormatButton,
  MinifyButton,
  TextCompareAfterSortButton,
  UnescapeButton,
} from "@/components/button";
import {LeftMenu} from "@/components/menu";
import version from "../lib/version";
import {switchAutoFormat, switchHideRightEditor} from '@/features/ctxSlice';

const editorHeight = "calc(100vh - 6rem)";

const MyEditor = dynamic(() => import("../components/editor"), {
  ssr: false,
  loading: () => <Loading height={editorHeight}></Loading>,
});

export default function Home() {
  const ctx = useSelector((state) => state.ctx);
  const dispatch = useDispatch();
  const leftContainerRef = useRef(null);

  useEffect(() => {
    console.log(`JSON For You 当前版本：${version}`);
  }, []);

  return (
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
              <li>
                <FormatButton></FormatButton>
              </li>
              <li>
                <MinifyButton></MinifyButton>
              </li>
              <li>
                <UnescapeButton></UnescapeButton>
              </li>
              <li>
                <LeftMenu></LeftMenu>
              </li>
              <li>
                <Switch text={"自动格式化"}
                        checked={ctx.enableAutoFormat}
                        onCheck={() => dispatch(switchAutoFormat())}></Switch>
              </li>
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
          <div className="border border-solid border-color">
            <MyEditor name="left" height={editorHeight}></MyEditor>
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
          <div className="border border-solid border-color">
            <MyEditor name="right" height={editorHeight}></MyEditor>
          </div>
        </div>
      </div>
      <StatusBar texts={ctx.statusBar}></StatusBar>
    </div>
  );
}
