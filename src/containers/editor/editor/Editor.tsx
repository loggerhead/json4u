"use client";

import { useEffect, type ComponentPropsWithoutRef } from "react";
import Loading from "@/components/Loading";
import { vsURL } from "@/lib/editor/cdn";
import { EditorWrapper, type Kind } from "@/lib/editor/editor";
import { useEditor, useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { loader, Editor as MonacoEditor } from "@monaco-editor/react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { example } from "./data";

loader.config({ paths: { vs: vsURL } });

interface EditorProps extends ComponentPropsWithoutRef<typeof MonacoEditor> {
  kind: Kind;
}

export default function Editor({ kind, ...props }: EditorProps) {
  const translations = useTranslations();
  const setEditor = useEditorStore((state) => state.setEditor);
  const setTranslations = useEditorStore((state) => state.setTranslations);

  useDisplayExample(kind);
  useRevealNode(kind);
  useEditTree(kind);

  return (
    <MonacoEditor
      language="json"
      loading={<Loading />}
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
      onMount={(editor, monaco) => {
        if (!window.monacoApi) {
          window.monacoApi = {
            Raw: monaco,
            KeyCode: monaco.KeyCode,
            MinimapPosition: monaco.editor.MinimapPosition,
            OverviewRulerLane: monaco.editor.OverviewRulerLane,
            Range: monaco.Range,
            RangeFromPositions: monaco.Range.fromPositions,
          };
        }
        // used for e2e tests.
        window.monacoApi[kind] = editor;

        const wrapper = new EditorWrapper(editor, kind);
        wrapper.init();
        setEditor(wrapper);
        setTranslations(translations);
        console.l(`finished initial editor ${kind}:`, wrapper);
      }}
      {...props}
    />
  );
}

// reveal position in text
export function useRevealNode(kind: Kind) {
  const editor = useEditor("main");
  const { isNeedReveal, revealPosition } = useStatusStore(
    useShallow((state) => ({
      isNeedReveal: state.isNeedReveal("editor"),
      revealPosition: state.revealPosition,
    })),
  );

  useEffect(() => {
    const { treeNodeId, target } = revealPosition;

    if (kind === "main" && editor && isNeedReveal && treeNodeId) {
      editor.setNodeSelection(treeNodeId, target);
    }
  }, [editor, revealPosition, isNeedReveal]);
}

export function useEditTree(kind: Kind) {
  const editor = useEditor("main");
  const { editQueue, clearEditQueue } = useStatusStore(
    useShallow((state) => ({
      editQueue: state.editQueue,
      clearEditQueue: state.clearEditQueue,
    })),
  );

  useEffect(() => {
    if (kind === "main" && editor && editQueue.length > 0) {
      editor.applyTreeEdits(editQueue);
      clearEditQueue();
    }
  }, [editor, editQueue]);
}

function useDisplayExample(kind: Kind) {
  const editor = useEditor("main");
  const incrEditorInitCount = useStatusStore((state) => state.incrEditorInitCount);

  useEffect(() => {
    if (kind === "main" && editor && incrEditorInitCount() <= 1) {
      editor.parseAndSet(example);
    }
  }, [editor]);
}
