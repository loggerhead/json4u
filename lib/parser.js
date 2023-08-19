import * as jsonc from "./jsonc-parser/main";

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
    if (jnode === undefined) {
      return undefined;
    }

    let node;
    if (jnode.type == "object") {
      node = newNode(jnode, "object", null);

      for (const property of jnode.children) {
        const [k, v] = property.children;
        // 如果容错解析时，有节点缺失，直接跳过整个 key: value
        if (!k || !v) {
          continue;
        }

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

  const errors = [];
  const jnode = jsonc.parseTree(text, errors, {
    disallowComments: true,
    allowTrailingComma: false,
  });
  const root = doParse(jnode);
  return [root, addContextToErrors(text, errors)];
}

// 添加上下文
function addContextToErrors(text, errors) {
  if (!errors?.length) {
    return [];
  }

  text = text.replace(/\n/g, " ");

  // 找到最近一个单词，如果找不到，则返回最近 5 个字符
  const findUntilFirstWord = (s, reverse = false) => {
    if (reverse) {
      s = s.slice(s.length - 100);
      s = s.split("").reverse().join("");
    } else {
      s = s.slice(0, 100);
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
    const leftText = text.slice(0, e.offset);
    const rightText = text.slice(e.offset + e.length);
    const middle = text.slice(e.offset, e.offset + e.length);
    let left = findUntilFirstWord(leftText, true);
    let right = findUntilFirstWord(rightText);

    left = (left.length < leftText.length ? "..." : "") + left;
    right = right + (right.length < rightText.length ? "..." : "");

    return {
      offset: e.offset,
      length: e.length,
      contextTexts: [left, middle, right],
    };
  });
}
