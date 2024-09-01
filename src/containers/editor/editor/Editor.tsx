"use client";

import { type ComponentPropsWithoutRef } from "react";
import Loading from "@/components/Loading";
import { EditorWrapper, type Kind } from "@/lib/editor/editor";
import { cn } from "@/lib/utils";
import { getEditorState, useEditor } from "@/stores/editorStore";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useTranslations } from "next-intl";

interface EditorProps extends ComponentPropsWithoutRef<typeof MonacoEditor> {
  kind: Kind;
}

export default function Editor({ kind, className, ...props }: EditorProps) {
  const editor = useEditor(kind);

  return (
    <>
      <Loading className={cn(editor && "hidden")} />
      <MyEditor kind={kind} className={cn(className, !editor && "invisible")} {...props} />
    </>
  );
}

function MyEditor({ kind, ...props }: EditorProps) {
  const translations = useTranslations();

  return (
    <MonacoEditor
      language="json"
      options={{
        fontSize: 13, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "off", // 关闭软换行。避免软换行时，点击出现不规则滚动的问题
        minimap: { enabled: false },
      }}
      onMount={(editor) => {
        new EditorWrapper(editor, kind).init();
        getEditorState().setTranslations(translations);
      }}
      onChange={(value, ev) => {
        const editor = getEditorState()[kind];
        editor && editor.onChange(value, ev);
      }}
      {...props}
    />
  );
}
