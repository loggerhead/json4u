import {loader} from "@monaco-editor/react";

export {EditorRef} from "./editor";

// 进行 monaco editor 的初始化
export function init() {
  if (typeof window === "undefined") {
    return;
  }

  window.MonacoEnvironment = {
    getWorker(id, label) {
      if (label === 'json') {
        return loadWorker("https://cdn.json4u.com/monaco-editor/0.45.0/json.worker.bundle.js");
      }

      return loadWorker("https://cdn.json4u.com/monaco-editor/0.45.0/editor.worker.bundle.js");
    },
  };

  loader.config({
    paths: {
      vs: "https://cdn.json4u.com/monaco-editor/0.45.0/min/vs",
    },
  });
}

export function loadWorker(url) {
  const workerBlob = new Blob(['importScripts(' + JSON.stringify(url) + ')'], {type: 'application/javascript'});
  const blobUrl = window.URL.createObjectURL(workerBlob);
  return new Worker(blobUrl);
}
