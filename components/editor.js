import {ReactReduxContext, useDispatch} from 'react-redux';
import {Editor} from "@monaco-editor/react";
import Loading from "../components/loading";
import {EditorRef, init} from "@/lib/editor";
import {useContext} from "react";
import {getEditor, setLeftEditor, setRightEditor} from '@/features/ctxSlice';
import {ctx} from "@/lib/store";

const now = performance.now();
init();

export default function MyEditor({name, timers, height}) {
  const {store} = useContext(ReactReduxContext);
  const dispatch = useDispatch();

  return (
    <Editor
      language="json"
      height={height}
      loading={<Loading height={height}></Loading>}
      options={{
        fontSize: 13, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "off", // 关闭软换行。避免软换行时，点击出现不规则滚动的问题
        minimap: {enabled: true},
      }}
      onMount={(editor, monaco) => {
        const editorRef = new EditorRef(store, dispatch, editor, monaco);
        editorRef.init();

        dispatch((name === "left" ? setLeftEditor : setRightEditor)(editorRef));

        // 当左右两侧编辑器都完成初始化后，将两者关联
        const c = ctx(store);
        if (c.leftEditor && c.rightEditor) {
          c.leftEditor.pair(c.leftEditor, c.rightEditor);
          c.rightEditor.pair(c.leftEditor, c.rightEditor);

          // 将编辑器注册到全局变量中，以供 e2e 框架使用
          if (typeof window !== "undefined") {
            window.leftEditor = c.leftEditor;
            window.rightEditor = c.rightEditor;
          }
        }

        timers.current.map(clearTimeout);
        const cost = performance.now() - now;
        console.log(`load ${name} editor cost: ${(cost / 1000).toFixed(2)}s`);
      }}
      onValidate={(markers) => getEditor(ctx(store), name).validate(markers)}
      onChange={() => getEditor(ctx(store), name).onChange()}
    />
  );
}
