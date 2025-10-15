import { init as dbInit } from "@/lib/db/config";
import { setupGlobalGraphStyle } from "@/lib/graph/style";
import { setupGlobalTableStyle } from "@/lib/table/style";
import * as Comlink from "comlink";
import { compareText, compareTree } from "./command/compare";
import { csv2json, json2csv } from "./command/csv";
import { escape, unescape } from "./command/escape";
import { jsonPath } from "./command/jsonPath";
import { parseAndFormat } from "./command/parse";
import { pythonDictToJSON } from "./command/pythonDictToJSON";
import { urlToJSON } from "./command/urlToJSON";
import {
  clearGraphNodeSelected,
  createGraph,
  createTable,
  searchInView,
  setGraphSize,
  setGraphViewport,
  setGraphRevealPosition,
  toggleGraphNodeHidden,
  toggleGraphNodeSelected,
  triggerGraphFoldSiblings,
  setTableRevealPosition,
} from "./stores/viewStore";

const worker = {
  parseAndFormat,
  compareText,
  compareTree,
  escape,
  unescape,
  pythonDictToJSON,
  urlToJSON,
  csv2json,
  json2csv,
  jsonPath,
  setupGlobalGraphStyle,
  setupGlobalTableStyle,
  createTable,
  createGraph,
  setGraphSize,
  setGraphViewport,
  setGraphRevealPosition,
  setTableRevealPosition,
  toggleGraphNodeHidden,
  toggleGraphNodeSelected,
  clearGraphNodeSelected,
  triggerGraphFoldSiblings,
  searchInView,
};

export type MyWorker = typeof worker;

dbInit();
Comlink.expose(worker);
