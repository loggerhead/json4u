import * as jsonc from "./jsonc-parser/main";

class ContextError {
  constructor(offset, length, contextTexts) {
    this.offset = offset;
    this.length = length;
    /** 错误上下文，包含 left, errorText, right
     * @type {string[]}
     */
    this.contextTexts = contextTexts;
  }
}

// 解析树
export class Node {
  constructor() {
    // 数据类型。取值为：object, array, value, key
    this.type = "";
    /** object 节点表示整个 object 的 token
     * array 节点表示整个 array 的 token
     * key 节点表示 key: value 的 token 或数组下标值
     * value 节点表示 value 的 token
     * @type {string | number}
     */
    this.token = "";
    // 相对全文的偏移量
    this.offset = 0;
    /** object 节点表示整个 object 的长度
     * array 节点表示整个 array 的长度
     * key 节点表示 key: value 的长度
     * value 节点表示 value 的长度
     */
    this.length = 0;
    /** 子节点的 key 节点
     * @type {Map<string | number, Node>}
     */
    this.keyNodes = new Map();
    // key 节点关联的 value 节点
    this.valueNode = null;
  }

  isObject() {
    return this.type === "object";
  }

  isArray() {
    return this.type === "array";
  }

  isValue() {
    return this.type === "value";
  }

  isKey() {
    return this.type === "key";
  }

  // 获取 token 字符串。如果父节点是 array，则是 number 类型的下标值
  getToken() {
    return this.token;
  }

  getKeys() {
    return this.keyNodes.keys();
  }

  getValues() {
    return Array.from(this.keyNodes.values()).map((node) => node.valueNode.getToken());
  }

  getKeyNode(key) {
    return this.keyNodes.get(key);
  }

  getValueNode(key) {
    return this.keyNodes.get(key)?.valueNode;
  }

  isEquals(node) {
    const doIsEquals = (node1, node2) => {
      if (node1?.type !== node2?.type) {
        return false;
      }

      if (node1.isObject() || node2.isArray()) {
        for (const key of node1.keyNodes.keys()) {
          if (!doIsEquals(node1.getValueNode(key), node2.getValueNode(key))) {
            return false;
          }
        }

        return true;
      } else {
        return node1.getToken() === node2.getToken();
      }
    };

    return doIsEquals(this, node);
  }

  // WARNING: sort 以后 offset 就不准了
  sort(reverse = false) {
    const doSort = (node) => {
      if (node.isObject()) {
        let sortedKeyNodes = [...node.keyNodes.entries()].sort();

        if (reverse) {
          sortedKeyNodes = sortedKeyNodes.reverse();
        }

        // 清除排序后无意义的 offset
        sortedKeyNodes.map((entry) => (entry[1].offset = undefined));
        node.keyNodes = new Map(sortedKeyNodes);
      }

      if (node.isObject() || node.isArray()) {
        for (const key of node.keyNodes.keys()) {
          doSort(node.getValueNode(key));
        }
      }
    };

    doSort(this);
    return this;
  }

  /**
   * 转成 JSON 字符串
   * @param {string} order - 排序类型，取值为 "asc", "desc"
   * @returns {string} JSON 字符串
   */
  stringify(order = "") {
    const doStringify = (node) => {
      if (node.isObject()) {
        const ss = [];
        const keys = [...node.keyNodes.keys()];

        if (order === "asc") {
          keys.sort();
        } else if (order === "desc") {
          keys.sort().reverse();
        }

        for (const key of keys) {
          const vnode = node.getValueNode(key);
          const valueStr = doStringify(vnode);
          ss.push(`${key}:${valueStr}`);
        }

        return `{${ss.join(",")}}`;
      } else if (node.isArray()) {
        const ss = [];

        for (const key of node.keyNodes.keys()) {
          const valueStr = doStringify(node.getValueNode(key));
          ss.push(valueStr);
        }

        return `[${ss.join(",")}]`;
      } else {
        return node.getToken();
      }
    };

    return doStringify(this);
  }
}

class JsonVisitor {
  constructor(text, options) {
    // 解析原字符串
    this.text = text;
    // 解析配置
    this.options = options;
    /**
     * 解析得到的树根节点
     * @type {Node}
     */
    this.root = new Node();
    //
    /**
     * 解析错误
     * @type {ParseError[]}
     */
    this.errors = [];

    this.keyPath = [];
    this.currentParent = null;
  }

  newNode(type, offset, length = -1) {
    const node = new Node();
    // 数据类型。取值为：object, array, value, key, index
    node.type = type;
    node.offset = offset;
    node.length = length;
    node.parent = this.currentParent;
    return node;
  }

  fillToken(node) {
    node.token = this.text.slice(node.offset, node.offset + node.length);
  }

  complete() {
    this.root = this.currentParent;
  }

  // 需要进行嵌套解析吗？
  isNeedNestParse(v) {
    return this.options?.nest && typeof v === 'string' && (/^\s*\{.*\}\s*$/.test(v) || /^\s*\[.*\]\s*$/.test(v));
  }

  hasError() {
    return this.errors.length > 0;
  }

  lastKey() {
    return this.keyPath[this.keyPath.length - 1];
  }

  incLastKey() {
    this.keyPath[this.keyPath.length - 1]++;
  }


  backToParent() {
    if (!this.currentParent.valueNode) {
      delete this.currentParent.valueNode;
    }

    if (this.currentParent.parent) {
      let node = this.currentParent;
      this.currentParent = node.parent;
      delete node.parent;
    }

    if (!this.currentParent.parent) {
      delete this.currentParent.parent;
    }
  }

  ensurePropertyComplete(endOffset) {
    const t = this.currentParent?.type;

    if (t === 'key') {
      this.currentParent.length = endOffset - this.currentParent.offset;
      this.fillToken(this.currentParent);

      if (typeof this.lastKey() !== 'number') {
        this.keyPath.pop();
      }

      this.backToParent();
    }
  }

  ensureGeneratedArrayKeyNode(offset) {
    if (this.currentParent?.type === 'array') {
      const keyNode = this.newNode('key', offset);
      this.currentParent.keyNodes.set(this.lastKey(), keyNode);
      this.currentParent = keyNode;
    }
  }

  // 比如 { "foo": "bar" } 解析 {。path 为 []
  onObjectBegin(offset, length, startLine, startColumn, pathSupplier) {
    if (this.hasError()) {
      return;
    }

    this.ensureGeneratedArrayKeyNode(offset);
    const node = this.newNode('object', offset);

    if (this.currentParent) {
      if (this.currentParent.type === 'key') {
        this.currentParent.valueNode = node;
      } else {
        this.currentParent.keyNodes.set(this.lastKey(), node);
      }
    }

    this.currentParent = node;
  }

  // 比如 { "foo": "bar" } 解析 "foo"。path 为 []
  onObjectProperty(key, offset, length, startLine, startColumn, pathSupplier) {
    if (this.hasError()) {
      return;
    }

    const token = this.text.slice(offset, offset + length);
    const node = this.newNode('key', offset);
    this.currentParent.keyNodes.set(token, node);
    this.currentParent = node;
    this.keyPath.push(token);
  }

  // 比如 { "foo": "bar" } 解析 }
  onObjectEnd(offset, length, startLine, startColumn) {
    if (this.hasError()) {
      return;
    }

    this.currentParent.length = offset + length - this.currentParent.offset;
    this.fillToken(this.currentParent);
    this.backToParent();
    this.ensurePropertyComplete(offset + length);
  }

  // 比如 [ "foo", "bar" ] 解析 [。path 为 []
  onArrayBegin(offset, length, startLine, startColumn, pathSupplier) {
    if (this.hasError()) {
      return;
    }

    this.ensureGeneratedArrayKeyNode(offset);
    const node = this.newNode('array', offset);

    if (this.currentParent) {
      if (this.currentParent.type === 'key') {
        this.currentParent.valueNode = node;
      } else {
        this.currentParent.keyNodes.set(this.lastKey(), node);
      }
    }

    this.currentParent = node;
    this.keyPath.push(0);
  }

  // 比如 [ "foo", "bar" ] 解析 ]
  onArrayEnd(offset, length, startLine, startColumn) {
    this.keyPath.pop();
    this.onObjectEnd(offset, length, startLine, startColumn);
  }

  // 比如 { "foo": "bar" } 解析 "bar"。path 为 ["foo"]
  // 比如 [ "foo", "bar" ] 解析 "foo"。path 为 [0]
  onLiteralValue(value, offset, length, startLine, startColumn, pathSupplier) {
    if (this.hasError()) {
      return;
    }

    this.ensureGeneratedArrayKeyNode(offset);

    let node = null;
    // 嵌套解析
    if (this.isNeedNestParse(value)) {
      const visitor = doParseJSON(value, this.options);
      if (!visitor.hasError()) {
        node = visitor.root;
      }
    }

    // 如果嵌套解析失败，降级
    if (node === null) {
      node = this.newNode('value', offset, length);
    }

    this.fillToken(node);

    // literal value 是根节点的情况
    if (!this.currentParent) {
      this.currentParent = node;
    } else if (this.currentParent.type === 'key') {
      this.currentParent.valueNode = node;
      this.ensurePropertyComplete(offset + length);
    }
  }

  // 解析 : 和 ,
  // - 比如 { "foo": "bar" } 解析 :
  // - 比如 [ "foo", "bar" ] 解析 ,
  // - 比如 {}, 解析 ,
  onSeparator(seq, offset, length, startLine, startColumn) {
    if (this.hasError() || seq !== ',') {
      return;
    }

    if (this.currentParent.type === 'array') {
      this.incLastKey();
    }
  }

  /**
   * @param {ParseErrorCode} error
   * @param {number} offset
   * @param {number} length
   * @param {number} startLine
   * @param {number} startColumn
   */
  onError(error, offset, length, startLine, startColumn) {
    this.errors.push({
      error: error,
      offset: offset,
      length: length,
    });
  }
}

/**
 * 解析 JSON 字符串
 * @param {string} text - JSON 字符串
 * @param {object} options - 解析配置
 * @returns {JsonVisitor} json visitor
 */
function doParseJSON(text, options = {}) {
  const visitor = new JsonVisitor(text, options);

  jsonc.visit(text, {
    onObjectBegin(offset, length, startLine, startColumn, pathSupplier) {
      return visitor.onObjectBegin(offset, length, startLine, startColumn, pathSupplier);
    },
    onObjectProperty(property, offset, length, startLine, startColumn, pathSupplier) {
      return visitor.onObjectProperty(property, offset, length, startLine, startColumn, pathSupplier);
    },
    onObjectEnd(offset, length, startLine, startColumn) {
      return visitor.onObjectEnd(offset, length, startLine, startColumn);
    },
    onArrayBegin(offset, length, startLine, startColumn, pathSupplier) {
      return visitor.onArrayBegin(offset, length, startLine, startColumn, pathSupplier);
    },
    onArrayEnd(offset, length, startLine, startColumn) {
      return visitor.onArrayEnd(offset, length, startLine, startColumn);
    },
    onLiteralValue(value, offset, length, startLine, startColumn, pathSupplier) {
      return visitor.onLiteralValue(value, offset, length, startLine, startColumn, pathSupplier);
    },
    onSeparator(character, offset, length, startLine, startColumn) {
      return visitor.onSeparator(character, offset, length, startLine, startColumn);
    },
    onError(error, offset, length, startLine, startColumn) {
      return visitor.onError(error, offset, length, startLine, startColumn);
    },
  }, {
    disallowComments: true,
    allowTrailingComma: false,
  });

  visitor.complete();
  return visitor;
}

/**
 * 解析 JSON 字符串
 * @param {string} text - JSON 字符串
 * @param {object} options - 解析配置
 * @returns {[Node, ContextError[]]} 根节点和解析错误
 */
// copy from https://github.com/microsoft/node-jsonc-parser/blob/main/src/impl/parser.ts#L212
export function parseJSON(text, options = {}) {
  const visitor = doParseJSON(text, options);
  return [visitor.root, addContextToErrors(visitor.text, visitor.errors)];
}

/**
 * 添加 errors 上下文
 * @param {string} text - JSON 字符串
 * @param {ParseError[]} errors - JSON 解析出错时的错误。ParseError 类型为 {offset, length}
 * @returns {ContextError[]} 添加上下文后的 errors
 */
function addContextToErrors(text, errors) {
  const maxWordLength = 30;

  if (!errors?.length) {
    return [];
  }

  text = text.replace(/\n/g, " ");

  // 找到最近一个单词，如果找不到，则返回最近 5 个字符
  const findUntilFirstWord = (s, reverse = false) => {
    if (reverse) {
      s = s.slice(s.length - maxWordLength);
      s = s.split("").reverse().join("");
    } else {
      s = s.slice(0, maxWordLength);
    }

    const mm = s.match(/^.*?\w+/);

    if (mm) {
      s = mm[0];
      return reverse ? s.split("").reverse().join("") : s;
    } else {
      return s.slice(s.length - 5);
    }
  };

  return errors.map((e) => {
    let middle = text.slice(e.offset, e.offset + e.length);

    const leftText = text.slice(0, e.offset);
    let left = findUntilFirstWord(leftText, true);
    left = (left.length < leftText.length ? "..." : "") + left;

    let right = "";

    if (middle.length > maxWordLength) {
      middle = middle.slice(0, maxWordLength);
      right = "...";
    } else {
      const rightText = text.slice(e.offset + e.length);
      right = findUntilFirstWord(rightText);
      right = right + (right.length < rightText.length ? "..." : "");
    }

    return new ContextError(e.offset, e.length, [left, middle, right]);
  });
}
