"use client";

import { useEffect, type ComponentPropsWithoutRef } from "react";
import Loading from "@/components/Loading";
import { EditorWrapper, type Kind } from "@/lib/editor/editor";
import { cn } from "@/lib/utils";
import { getEditorState, useEditor, useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { getTree } from "@/stores/treeStore";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

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
  const setEditor = useEditorStore((state) => state.setEditor);
  const setTranslations = useEditorStore((state) => state.setTranslations);

  useDisplayExample();
  useRevealNode();

  return (
    <MonacoEditor
      language="json"
      options={{
        fontSize: 13, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "on",
        minimap: { enabled: false },
        stickyScroll: {
          enabled: true,
          defaultModel: "foldingProviderModel",
        },
      }}
      onMount={(editor) => {
        const wrapper = new EditorWrapper(editor, kind);
        wrapper.init();
        setEditor(wrapper);
        setTranslations(translations);
        console.l(`finished initial editor ${kind}:`, wrapper);
      }}
      onChange={(value, ev) => {
        const editor = getEditorState()[kind];
        editor && editor.onChange(value, ev);
      }}
      {...props}
    />
  );
}

// reveal position in text
export function useRevealNode() {
  const editor = useEditor("main");
  const { isNeedReveal, revealPosition } = useStatusStore(
    useShallow((state) => ({
      isNeedReveal: state.isNeedReveal("editor"),
      revealPosition: state.revealPosition,
    })),
  );

  useEffect(() => {
    const { treeNodeId, type } = revealPosition;

    if (editor && isNeedReveal && treeNodeId) {
      const node = getTree().node(treeNodeId);
      if (node) {
        editor.revealOffset((type === "key" ? node.boundOffset : node.offset) + 1);
      }
    }
  }, [revealPosition, isNeedReveal]);
}

const exampleData = `{
  "Aidan Gillen": {
      "array": [
          "Game of Thron\\"es",
          "The Wire"
      ],
      "string": "some string",
      "int": 2,
      "aboolean": true,
      "boolean": true,
      "null": null,
      "a_null": null,
      "another_null": "null check",
      "object": {
          "foo": "bar",
          "object1": {
              "new prop1": "new prop value"
          },
          "object2": {
              "new prop1": "new prop value"
          },
          "object3": {
              "new prop1": "new prop value"
          },
          "object4": {
              "new prop1": "new prop value"
          }
      }
  },
  "Amy Ryan": {
      "one": "In Treatment",
      "two": "The Wire"
  },
  "Annie Fitzgerald": [
      "Big Love",
      "True Blood"
  ],
  "Anwan Glover": [
      "Treme",
      "The Wire"
  ],
  "Alexander Skarsgard": [
      "Generation Kill",
      "True Blood"
  ],
  "Clarke Peters": null
}`;

function useDisplayExample() {
  const editor = useEditor("main");
  const incrEditorInitCount = useStatusStore((state) => state.incrEditorInitCount);

  useEffect(() => {
    if (editor && incrEditorInitCount() <= 1) {
      editor.parseAndSet(exampleData);
    }
  }, [editor]);
}
