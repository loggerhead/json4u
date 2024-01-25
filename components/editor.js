import {ReactReduxContext, useDispatch} from 'react-redux';
import {Editor} from "@monaco-editor/react";
import {EditorRef, init} from "@/lib/editor";
import {useContext} from "react";
import {setLeftEditor, setRightEditor} from '@/reducers';
import {leftEditorSelector, rightEditorSelector} from "@/lib/store";

init();

function getEditor(store, name) {
  const state = store.getState();
  return name === "left" ? leftEditorSelector(state) : rightEditorSelector(state);
}

export default function MyEditor({name, height}) {
  const {store} = useContext(ReactReduxContext);
  const dispatch = useDispatch();

  return (
    <Editor
      language="json"
      height={height}
      options={{
        fontSize: 13, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "off", // 关闭软换行。避免软换行时，点击出现不规则滚动的问题
        minimap: {enabled: true},
      }}
      onMount={(editor, monaco) => {
        const editorRef = new EditorRef(name, store, dispatch, editor);
        editorRef.init();

        dispatch((name === "left" ? setLeftEditor : setRightEditor)(editorRef));

        // 当左右两侧编辑器都完成初始化后，将两者关联
        const leftEditor = getEditor(store, "left");
        const rightEditor = getEditor(store, "right");

        if (leftEditor && rightEditor) {
          leftEditor.pair(leftEditor, rightEditor);
          rightEditor.pair(leftEditor, rightEditor);

          // 将编辑器注册到全局变量中，以供 e2e 框架使用
          if (typeof window !== "undefined") {
            window.leftEditor = leftEditor;
            window.rightEditor = rightEditor;
          }
        }
      }}
      onValidate={(markers) => getEditor(store, name).validate(markers)}
      onChange={() => getEditor(store, name).onChange()}
    />
  );
}
