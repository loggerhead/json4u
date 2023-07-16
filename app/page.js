import MyEditor from "../components/editor";
import MyButton from "../components/button";

export default function Home() {
  return (
    <div className="gap-2">
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
          <div id="monaco-editor-embed">
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
    </div>
  );
}
