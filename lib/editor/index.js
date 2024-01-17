import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {loader} from "@monaco-editor/react";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";

export {EditorRef} from "./editor";

// 进行 monaco editor 的初始化
export function init() {
  loader.config({monaco});
}

export function loadWorker(url) {
  const workerBlob = new Blob(['importScripts(' + JSON.stringify(url) + ')'], {type: 'application/javascript'});
  const blobUrl = window.URL.createObjectURL(workerBlob);
  return new Worker(blobUrl);
}
