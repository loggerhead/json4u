import * as Comlink from "comlink";
import { compareText, compareTree } from "./command/compare";
import { csv2json, json2csv } from "./command/csv";
import { escape, unescape } from "./command/escape";
import { parseAndFormat } from "./command/parse";
import { pythonDictToJSON } from "./command/pythonDictToJSON";
import { urlToJson } from "./command/urlToJson";

export interface MyWorker {
  parseAndFormat: typeof parseAndFormat;
  compareText: typeof compareText;
  compareTree: typeof compareTree;
  escape: typeof escape;
  unescape: typeof unescape;
  pythonDictToJSON: typeof pythonDictToJSON;
  urlToJson: typeof urlToJson;
  csv2json: typeof csv2json;
  json2csv: typeof json2csv;
}

Comlink.expose({
  parseAndFormat,
  compareText,
  compareTree,
  escape,
  unescape,
  pythonDictToJSON,
  urlToJson,
  csv2json,
  json2csv,
} satisfies MyWorker);
