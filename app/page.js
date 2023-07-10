import MyEditor from "../components/editor";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main>
      <div className={styles.raised}>
        <div id="playground-container" className="flex">
          <div id="editor-container" className="flex flex-col	grow relative w-calc-editor">
            <div id="editor-toolbar" className="flex relative justify-between	clear-both">
              <ul className="flex">
                <li>
                  <a id="run-button" href="#">
                    运行
                  </a>
                </li>
                <li className="dropdown">
                  <a href="#" id="exports-dropdown" className="dropdown-toggle" data-toggle="dropdown">
                    导出 <span className="caret"></span>
                  </a>
                  <ul className="dropdown-menu" id="export-dropdown-menu">
                    <li>
                      <a href="#">Tweet link to Playground</a>
                    </li>
                    <li className="divider"></li>
                    <li>
                      <a href="#">复制为 Markdown 格式的 issue 模板</a>
                    </li>
                    <li className="divider"></li>
                  </ul>
                </li>
                <li>
                  <a id="share-button" href="#">
                    Share
                  </a>
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
          <div id="playground-sidecar" className="flex flex-col basis-80 w-80	max-w-xs z-10">
            <div id="playground-plugin-tabbar"></div>
            <div className="playground-plugin-container"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
