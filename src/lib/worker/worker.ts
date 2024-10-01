import { setupGlobalGraphStyle } from "@/lib/graph/layout";
import * as Comlink from "comlink";
import { compareText, compareTree } from "./command/compare";
import { csv2json, json2csv } from "./command/csv";
import { escape, unescape } from "./command/escape";
import { parseAndFormat } from "./command/parse";
import { pythonDictToJSON } from "./command/pythonDictToJSON";
import { urlToJson } from "./command/urlToJson";
import { createGraph, createTable, setGraphSize, setGraphViewport } from "./stores/viewStore";

const worker = {
  parseAndFormat,
  compareText,
  compareTree,
  escape,
  unescape,
  pythonDictToJSON,
  urlToJson,
  csv2json,
  json2csv,
  setupGlobalGraphStyle,
  createTable,
  createGraph,
  setGraphSize,
  setGraphViewport,
};

export type MyWorker = typeof worker;

Comlink.expose(worker);
