import MyEditor from "../components/editor";
import MyButton from "../components/button";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main>
      <div className={`{styles.raised} gap-2`}>
        <div id="playground-container" className="flex">
          <div id="editor-container" className="flex flex-col	grow relative w-calc-editor gap-2">
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
            <div id="monaco-editor-embed" className={styles.editor}>
              <MyEditor></MyEditor>
            </div>
          </div>
          <div id="playground-dragbar" className="border-solid border-l-2 ml-0.5 p-1 cursor-col-resize"></div>
          <div id="playground-sidecar" className="flex flex-col basis-80 w-80	max-w-xs z-10 gap-2">
            <div id="playground-plugin-tabbar">
              <MyButton>比较</MyButton>
            </div>
            <div className="playground-plugin-container">
              <MyEditor enableMinimap={false}></MyEditor>
            </div>
          </div>
        </div>
        <div class="text-center text-[12px]">
          <a href="/">Json For You ·</a>
          <a href="https://beian.miit.gov.cn" target="_blank">
            粤ICP备16007488号 ·
          </a>
          <a href="/guide">使用指南 ·</a>
          <a href="https://github.com/loggerhead/json4u-issue/issues">Feedback</a>
        </div>
      </div>
    </main>
  );
}
