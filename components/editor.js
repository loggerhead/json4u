import {ReactReduxContext, useDispatch} from 'react-redux';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {Editor, loader} from "@monaco-editor/react";
import Loading from "../components/loading";
import {EditorRef} from "@/lib/editor/editor";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";
import {useContext} from "react";
import {getEditor, setLeftEditor, setRightEditor} from '@/features/ctxSlice';
import {ctx} from "@/lib/store";

// NOTICE: 目前删除不了内置的右键菜单项：https://github.com/microsoft/monaco-editor/issues/1567
loader.config({monaco});

export default function MyEditor({name, height}) {
  const {store} = useContext(ReactReduxContext);
  const dispatch = useDispatch();

  return (
    <Editor
      id={`${name}Editor`}
      language="json"
      height={height}
      loading={<Loading height={height}></Loading>}
      options={{
        fontSize: 14, // 设置初始字体大小
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
        }
      }}
      onValidate={(markers) => getEditor(ctx(store), name).validate(markers)}
      onChange={() => getEditor(ctx(store), name).onChange()}
    />
  );
}
