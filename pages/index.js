import MyEditor from "../components/editor";
import styles from "./index.module.scss";

export default function Home() {
  return (
    <main>
      <div className={styles.raised}>
        <div id="playground-container" className={styles.playground_container}>
          <div id="editor-container" className={styles.editor_container}>
            <div id="editor-toolbar" className={styles.editor_toolbar}>
              <ul>
                <li>
                  <a id="run-button" href="#">
                    运行
                  </a>
                </li>
                <li className="dropdown">
                  <a
                    href="#"
                    id="exports-dropdown"
                    className="dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="true"
                    aria-controls="export-dropdown-menu"
                  >
                    导出 <span className="caret"></span>
                  </a>
                  <ul className="dropdown-menu" id="export-dropdown-menu" aria-labelledby="whatisnew-button">
                    <li>
                      <a href="#" aria-label="Tweet link to Playground">
                        Tweet link to Playground
                      </a>
                    </li>
                    <li className="divider"></li>
                    <li>
                      <a href="#" aria-label="复制为 Markdown 格式的 issue 模板">
                        复制为 Markdown 格式的 issue 模板
                      </a>
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
              <ul className="right">
                <li>
                  <a id="sidebar-toggle" aria-label="Hide Sidebar" href="#">
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
