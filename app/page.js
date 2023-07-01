import MyEditor from "../components/editor";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main>
      <div className={styles.raised}>
        <div id="playground-container" className={styles.playground_container}>
          <div id="editor-container" className={styles.editor_container}>
            <div id="editor-toolbar" className="relative">
              <ul>
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
              <ul className="absolute inset-y-0 right-0 w-16">
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
          <div className={styles.dragbar}></div>
          <div className={styles.sidebar}>
            <div id="playground-plugin-tabbar"></div>
            <div className="playground-plugin-container"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
