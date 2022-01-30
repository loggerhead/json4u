import { isObject } from "./typeHelper";

export const MORE = "more";
export const MISS = "miss";
export const UNEQ = "uneq";
export const UNEQ_KEY = "uneq_key";
export type DiffType =
  | typeof MORE
  | typeof MISS
  | typeof UNEQ
  | typeof UNEQ_KEY;

const SEPARATOR = "/";

export interface Diff {
  line: number;
  val: any;
  type: DiffType;
}

export class TraceRecord {
  // current path of key
  currentPath: Array<String>;
  // formated JSON for output
  out: string;
  // line number when generate paths
  line: number;
  // current indent of key
  indent: number;
  // paths of all keys. generated at format
  paths: { [path: string]: number };

  constructor() {
    this.currentPath = [];
    this.out = "";
    this.line = 1;
    this.indent = -1;
    this.paths = {};
  }

  addTrace(p: string = SEPARATOR) {
    if (p !== SEPARATOR) {
      p = p.replace(SEPARATOR, "#");
    }
    this.currentPath.push(p);
  }

  addArrayTrace(i: number) {
    this.currentPath.push(`${SEPARATOR}[${i}]`);
  }

  popTrace() {
    this.currentPath.pop();
  }

  addPath(key?: string) {
    this.paths[this.genPath(key)] = this.line;
  }

  // Generate a JSON path based on the specific configuration and an optional property.
  genPath(prop?: string) {
    let path = this.currentPath.join("");

    if (path.charAt(path.length - 1) === SEPARATOR) {
      path = path.substring(0, path.length - 1);
    }

    if (prop) {
      path += SEPARATOR + prop.replace(SEPARATOR, "#");
    }

    return path.length > 0 ? path : SEPARATOR;
  }

  // Generate the diff and verify that it matches a JSON path
  genDiff(type: any, key: string, val: string | null): Diff {
    let path = this.genPath(key);
    let line = this.paths[path];

    if (!line) {
      throw `Unable to find line number for path[${line}]. key[${key}]`;
    }

    return {
      line: line,
      val: val,
      type: type,
    };
  }
}

// decorate the data tree with the data about this object.
export function trace(config: TraceRecord, data: any) {
  if (Array.isArray(data)) {
    traceArray(config, data);
    return;
  }

  startObject(config);
  config.addTrace();

  for (const key in data) {
    config.line++;
    config.addTrace(key);
    config.addPath();
    traceVal(config, data[key]);
    config.popTrace();
  }

  finishObject(config);
  config.popTrace();
}

function traceArray(config: TraceRecord, data: any) {
  startObject(config);

  data.forEach(function (val: any, i: number) {
    config.line++;
    config.addPath(`[${i}]`);
    config.addArrayTrace(i);
    traceVal(config, val);
    config.popTrace();
  });

  finishObject(config);
  config.popTrace();
}

function traceVal(config: TraceRecord, data: any) {
  if (Array.isArray(data)) {
    config.indent++;

    data.forEach(function (val: any, i: number) {
      config.line++;
      config.addPath(`[${i}]`);
      config.addArrayTrace(i);
      traceVal(config, val);
      config.popTrace();
    });

    config.indent--;
    config.line++;
  } else if (isObject(data)) {
    trace(config, data);
  }
}

function startObject(config: TraceRecord) {
  config.indent++;

  if (Object.keys(config.paths).length === 0) {
    config.addPath();
  }

  if (config.indent === 0) {
    config.indent++;
  }
}

function finishObject(config: TraceRecord) {
  if (config.indent === 0) {
    config.indent--;
    config.line++;
  }

  config.indent--;
  config.line++;
}
