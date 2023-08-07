import * as jsonc from "./jsonc-parser/main";

// 解析错误
const parseErrorCodes = new Map([
  [1, { name: "InvalidSymbol", description: "" }],
  [2, { name: "InvalidNumberFormat", description: "" }],
  [3, { name: "PropertyNameExpected", description: "" }],
  [4, { name: "ValueExpected", description: "" }],
  [5, { name: "ColonExpected", description: "" }],
  [6, { name: "CommaExpected", description: "" }],
  [7, { name: "CloseBraceExpected", description: "" }],
  [8, { name: "CloseBracketExpected", description: "" }],
  [9, { name: "EndOfFileExpected", description: "" }],
  [10, { name: "InvalidCommentToken", description: "" }],
  [11, { name: "UnexpectedEndOfComment", description: "" }],
  [12, { name: "UnexpectedEndOfString", description: "" }],
  [13, { name: "UnexpectedEndOfNumber", description: "" }],
  [14, { name: "InvalidUnicode", description: "" }],
  [15, { name: "InvalidEscapeCharacter", description: "" }],
  [16, { name: "InvalidCharacter", description: "" }],
]);

// TODO: 改成友好的错误提示
export function getErrorDescription(err) {
  const { description } = parseErrorCodes.get(err.error);
  return `${description}`;
}

// 解析树
export class Node {
  constructor() {
    // 数据类型。取值为：object, arrary, value, key, index
    this.type = "";
    // 数据值
    this.token = "";
    // 相对全文的偏移量
    this.offset = 0;
    // index 节点的 length 表示对应 value 的长度
    this.length = 0;
    // 当前节点在解析树中的路径
    this.path = [];
    // 子节点的 key 节点
    this.keyNodes = new Map();
    // 当前节点关联的 value 节点。仅 key, index 节点有关联的 value 节点
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
  isIndex() {
    return this.type === "index";
  }

  // 获取 token 字符串。如果是 index，则是 number 类型的下标值
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

/**
 * 解析 JSON 字符串
 * @param {string} text - JSON 字符串
 * @param {ParseError[]} errors - JSON 解析出错时的错误
 * @returns {[Node, Error]} 解析成功后的根节点。Error 类型为 {error, offset, length}
 */
export function parseJSON(text) {
  const errors = [];
  const jnode = jsonc.parseTree(text, errors, {
    allowTrailingComma: true,
  });

  const getToken = (jnode) => {
    return text.slice(jnode.offset, jnode.offset + jnode.length);
  };

  const newNode = (jnode, type, vnode, index = undefined) => {
    const node = new Node();
    node.offset = jnode.offset;
    node.length = type === "key" ? jnode.parent.length : jnode.length;
    node.token = type === "index" ? index : getToken(jnode);
    node.type = type;
    node.path = jsonc.getNodePath(jnode);
    node.valueNode = vnode;
    return node;
  };

  const doParse = (jnode) => {
    let node;
    if (jnode.type == "object") {
      node = newNode(jnode, "object", null);

      for (const property of jnode.children) {
        const [k, v] = property.children;
        const token = getToken(k);
        const vnode = v.type == "object" || v.type == "array" ? doParse(v) : newNode(v, "value");
        const knode = newNode(k, "key", vnode);
        node.keyNodes.set(token, knode);
      }
    } else if (jnode.type == "array") {
      node = newNode(jnode, "array", null);

      for (let i = 0; i < jnode.children.length; i++) {
        const child = jnode.children[i];
        const vnode = child.type == "object" || child.type == "array" ? doParse(child) : newNode(child, "value");
        const knode = newNode(child, "index", vnode, i);
        node.keyNodes.set(i, knode);
      }
    } else {
      node = newNode(jnode, "value", null);
    }

    return node;
  };

  const root = doParse(jnode);
  return [root, errors];
}
