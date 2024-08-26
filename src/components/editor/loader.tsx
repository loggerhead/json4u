"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/Loading";
import { loader } from "@monaco-editor/react";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";

const Editor = dynamic(
  async () => {
    await import(/* webpackChunkName: "monaco-editor" */ "monaco-editor/esm/vs/editor/editor.api").then((monaco) => {
      loader.config({ monaco });
      window.monacoApi = {
        KeyCode: monaco.KeyCode,
        MinimapPosition: monaco.editor.MinimapPosition,
        OverviewRulerLane: monaco.editor.OverviewRulerLane,
        Range: monaco.Range,
        RangeFromPositions: monaco.Range.fromPositions,
      };
    });
    return await import("./Editor");
  },
  {
    ssr: false,
    loading: () => <Loading />,
  },
);

export default Editor;
