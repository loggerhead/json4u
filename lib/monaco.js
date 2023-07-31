import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loader, Editor } from "@monaco-editor/react";

// TODO: 删除所有内置的右键菜单项：https://github.com/microsoft/monaco-editor/issues/1567
loader.config({
  ...monaco,
  // 配置右键菜单使用中文
  "vs/nls": {
    availableLanguages: {
      "*": "zh-cn",
    },
  },
});

export { monaco, Editor };
