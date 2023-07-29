import * as jsonc from "jsonc-parser";
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from "diff-match-patch";
import stringify from "json-stable-stringify";
import { isBaseType, isNumber, isObject } from "./typehelper";

export const INS = "insert";
export const DEL = "delete";

// 语义化差异
export class SemanticDiffResult {
  constructor(diffs, isTextCompare = false) {
    this.diffs = diffs;
    // 是文本比较吗？
    this.isTextCompare = isTextCompare;
  }
}

// 差异
export class Diff {
  constructor(offset, length, diffType, highlightLine = true, path = []) {
    this.path = null; // json path
    this.offset = offset; // 整个文档中的偏移量
    this.length = length; // 差异部分的长度
    this.diffType = diffType; // 差异类型
    this.highlightLine = highlightLine; // 高亮整行
    this.path = path;
  }
}

// json 解析树
export class Tree {
  constructor(text) {
    this.text = text;
    this.rootNode = jsonc.parseTree(this.text);
    this.object = this.getNodeValue(this.rootNode);
  }

  // 获取 key 节点。比如：path=["foo"] object={ "foo": "value" } => 返回 "foo"
  getKeyNode(path) {
    const parentNode = jsonc.findNodeAtLocation(this.rootNode, path)?.parent;
    return parentNode?.children[0];
  }

  // 获取 value 节点。比如：path=["foo"] object={ "foo": "value" } => 返回 "value"
  getValueNode(path) {
    return jsonc.findNodeAtLocation(this.rootNode, path);
  }

  // 获取 key token 字符串。比如: object={ "foo": "value" } => `"foo"`
  getKey(path) {
    return this.getNodeValue(this.getKeyNode(path));
  }

  // 获取 value token 字符串。比如: object={ "foo": "value" } => `"value"`
  getValue(path) {
    return this.getNodeValue(this.getValueNode(path));
  }

  // 获取 node token 字符串。比如: object={ "foo": "value" }，"value" 节点的值是 `"value"`
  getNodeValue(node) {
    if (this.isObject(node) || this.isArray(node)) {
      return jsonc.getNodeValue(node);
    } else {
      // 返回 value 的 token 部分字符串
      // NOTICE: 数字需要保留原始字符串，避免 int64 丢失精度
      return this.text.slice(node.offset, node.offset + node.length);
    }
  }

  isObject(node) {
    return node.type === "object";
  }

  isArray(node) {
    return node.type === "array";
  }
}

/**
 * 语义化比较文本的差异。如果不能语义化比较，则降级成文本比较
 * @param {string} ltext - 左侧文本
 * @param {string} rtext - 右侧文本
 * @returns {SemanticDiff} 语义化差异
 */
export function semanticCompare(ltext, rtext) {
  try {
    // 校验 json valid，失败会抛出异常
    JSON.parse(ltext);
    JSON.parse(rtext);

    // 只支持 object、array 比较。其它情况走文本比较
    const ltree = new Tree(ltext);
    const rtree = new Tree(rtext);
    const comparer = new Comparer(ltree, rtree);
    const diffs = comparer.compare();
    return new SemanticDiffResult(diffs);
  } catch (e) {
    const diffs = compareText(ltext, rtext);
    return new SemanticDiffResult(diffs, true);
  }
}

// Json 比较器
export class Comparer {
  constructor(leftTree, rightTree) {
    // 记录 jsonc.Node，用于获取在文本中的原始信息
    this.leftTree = leftTree;
    this.rightTree = rightTree;
    // 记录比较过程中遍历的 json path
    this.leftPath = [];
    this.rightPath = [];
    // 比较出来的差异
    this.diffs = [];
  }

  compare() {
    this.diffVal(this.leftTree.object, this.rightTree.object);
    return this.diffs;
  }

  // 根据差异类型获取 json 解析树的根节点
  getTreeByDiffType(diffType) {
    let tree = null;
    let path = null;

    if (diffType === DEL) {
      tree = this.leftTree;
      path = this.leftPath;
    } else if (diffType === INS) {
      tree = this.rightTree;
      path = this.rightPath;
    }

    return [tree, path];
  }

  // 创建差异
  newDiff(diffType, key = undefined, highlightLine = true) {
    let [tree, path] = this.getTreeByDiffType(diffType);

    if (key !== undefined) {
      path = [...path, key];
    }

    const node = tree.getValueNode(path);
    return new Diff(node.offset, node.length, diffType, highlightLine, path);
  }

  // 创建行内差异
  newInlineDiffs(diffs, isKeyDiff = false) {
    for (const diff of diffs) {
      let [tree, path] = this.getTreeByDiffType(diff.diffType);
      const node = isKeyDiff ? tree.getKeyNode(path) : tree.getValueNode(path);
      diff.offset += node.offset;
      diff.path = jsonc.getNodePath(node);
    }

    return diffs;
  }

  // 比较值
  diffVal(ldata, rdata) {
    if (Array.isArray(ldata) && Array.isArray(rdata)) {
      this.diffArray(ldata, rdata);
    } else if (isObject(ldata) && isObject(rdata)) {
      this.diffObject(ldata, rdata);
      // 比较到基本类型时
    } else if (ldata !== rdata) {
      // 如果需要字符级比较
      if (isNeedDiffVal(ldata, rdata)) {
        const ltext = this.leftTree.getValue(this.leftPath);
        const rtext = this.rightTree.getValue(this.rightPath);
        const charDiffs = compareText(ltext, rtext);
        const diffs = this.newInlineDiffs(charDiffs);
        this.diffs.push(...diffs);
      } else {
        const ldiff = this.newDiff(DEL);
        const rdiff = this.newDiff(INS);
        this.diffs.push(ldiff, rdiff);
      }
    }

    return this;
  }

  // 比较数组
  diffArray(ldata, rdata) {
    // 数组维度的 diff
    const diffs = compareArray(ldata, rdata);

    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i];
      const ndiff = diffs[i + 1];
      // 数组下标
      const idx = diff.offset;
      const diffType = diff.diffType;

      // 如果两边的数组元素不同，则递归比较
      if (diffType === DEL && ndiff?.diffType === INS) {
        const ridx = ndiff.offset;
        this.leftPath.push(idx);
        this.rightPath.push(ridx);

        this.diffVal(ldata[idx], rdata[ridx]);

        this.leftPath.pop();
        this.rightPath.pop();
        i++;
      } else if (diffType === DEL || diffType === INS) {
        this.diffs.push(this.newDiff(diffType, idx));
      }
    }

    return this;
  }

  // 比较对象
  diffObject(ldata, rdata) {
    const [commonKeys, leftOnlyKeys, rightOnlyKeys] = splitKeys(ldata, rdata);

    // 比较相同的 key
    commonKeys.forEach((k) => {
      this.leftPath.push(k);
      this.rightPath.push(k);

      this.diffVal(ldata[k], rdata[k]);

      this.leftPath.pop();
      this.rightPath.pop();
    });

    const seen = new Set();

    // 将左右两侧只有 key 存在差异的部分加入 diffs
    leftOnlyKeys.forEach((lkey) => {
      rightOnlyKeys.forEach((rkey) => {
        if (!seen.has(rkey) && isNeedDiffKey(ldata, rdata, lkey, rkey)) {
          this.leftPath.push(lkey);
          this.rightPath.push(rkey);

          const ltext = this.leftTree.getKey(this.leftPath);
          const rtext = this.rightTree.getKey(this.rightPath);
          const charDiffs = compareText(ltext, rtext);
          const diffs = this.newInlineDiffs(charDiffs, true);
          this.diffs.push(...diffs);

          seen.add(lkey);
          seen.add(rkey);
          this.leftPath.pop();
          this.rightPath.pop();
        }
      });
    });

    // 左侧剩余的 key 全都算作差异
    leftOnlyKeys.forEach((key) => {
      if (!seen.has(key)) {
        this.diffs.push(this.newDiff(DEL, key));
      }
    });

    // 右侧剩余的 key 全都算作差异
    rightOnlyKeys.forEach((key) => {
      if (!seen.has(key)) {
        this.diffs.push(this.newDiff(INS, key));
      }
    });

    return this;
  }
}

/**
 * 比较两个字符串的差异
 * @param {string} ltext - 左侧字符串
 * @param {string} rtext - 右侧字符串
 * @returns {Diff[]} 行内差异。其中 offset 表示行内差异的起始位置
 */
export function compareText(ltext, rtext, ignoreBlank = true) {
  let lpos = 0;
  let rpos = 0;
  const diffs = [];

  const dmp = new diff_match_patch();
  let dd = dmp.diff_main(ltext, rtext);
  // 将差异整理成可读性更高的形式 https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
  dmp.diff_cleanupSemantic(dd);
  dd = dd.filter((d) => d[1].length > 0);

  for (let i = 0; i < dd.length; i++) {
    const [dtype, text] = dd[i];
    // text length
    const n = text.length;

    // equal
    if (dtype === DIFF_EQUAL) {
      lpos += n;
      rpos += n;
      // delete from left side
    } else if (dtype === DIFF_DELETE) {
      // 如果去除首尾空格，与 INSERT 部分的文本相等，说明没有空白字符以外的变化
      const skipBlankDiff = ignoreBlank && i < dd.length - 1 && ignoreBlankEqual(dd[i][1], dd[i + 1][1]);

      if (!skipBlankDiff) {
        diffs.push(new Diff(lpos, n, DEL, false));
      }

      lpos += n;
      // insert to right side
    } else if (dtype === DIFF_INSERT) {
      // 如果去除首尾空格，与 DELETE 部分的文本相等，说明没有空白字符以外的变化
      const skipBlankDiff = ignoreBlank && i > 0 && ignoreBlankEqual(dd[i][1], dd[i - 1][1]);

      if (!skipBlankDiff) {
        diffs.push(new Diff(rpos, n, INS, false));
      }

      rpos += n;
    }
  }

  return diffs;
}

/**
 * 比较两个数组的差异
 * @param {any[]} ldata - 左侧数组
 * @param {any[]} rdata - 右侧数组
 * @returns {Diff[]} 数组差异。其中 offset 表示数组中元素的下标
 */
export function compareArray(ldata, rdata) {
  const lineArray = [""];
  const lineHash = {};
  let n = lineArray.length;

  // 将 array 映射成 unicode 字符串，然后进行 text compare
  const lines2chars = (lines) => {
    const baseChar = "0".charCodeAt(0);
    let chars = "";

    for (const line of lines) {
      if (lineHash.hasOwnProperty(line)) {
        chars += String.fromCharCode(baseChar + lineHash[line]);
      } else {
        chars += String.fromCharCode(baseChar + n);
        lineHash[line] = n;
        lineArray[n++] = line;
      }
    }

    return chars;
  };

  // 每一行是一个数组元素
  const llines = ldata.map((o) => stringify4diff(o));
  const rlines = rdata.map((o) => stringify4diff(o));
  // 每一个字符是一个数组元素
  const lchars = lines2chars(llines);
  const rchars = lines2chars(rlines);
  let dmp = new diff_match_patch();
  let dd = dmp.diff_main(lchars, rchars, false);

  let lidx = 0;
  let ridx = 0;
  const diffs = [];

  for (let i = 0; i < dd.length; i++) {
    // text 表示行的内容。比如：
    //
    //     ldata = [1, 2, 3]
    //     rdata = [1, 3]
    //     dd 为 [(0, 'a'), (-1, 'b'), (0, 'c')]
    //     text 为 'a'、'b'、'c'，分别表示数组中的第 1、2、3 个元素
    const [dtype, text] = dd[i];

    for (let j = 0; j < text.length; j++) {
      if (dtype === DIFF_EQUAL) {
        lidx++;
        ridx++;
      } else if (dtype === DIFF_DELETE) {
        diffs.push(new Diff(lidx, 1, DEL));
        lidx++;
      } else if (dtype === DIFF_INSERT) {
        diffs.push(new Diff(ridx, 1, INS));
        ridx++;
      }
    }
  }

  return diffs;
}

/**
 * 分离两个对象共同、差异的 key
 * @param {object} ldata - 左侧对象
 * @param {object} rdata - 右侧对象
 * @returns {[Set, Set, Set]} key 差异，依次为：共同、左侧、右侧
 */
export function splitKeys(ldata, rdata) {
  function separate(a, b) {
    let intersection = new Set();

    if (a.size > b.size) {
      [a, b] = [b, a];
    }

    a.forEach((v) => {
      if (b.has(v)) {
        intersection.add(v);
        a.delete(v);
        b.delete(v);
      }
    });

    return intersection;
  }

  const leftOnly = new Set([...Object.keys(ldata)]);
  const rightOnly = new Set([...Object.keys(rdata)]);
  const intersection = separate(leftOnly, rightOnly);
  return [intersection, leftOnly, rightOnly];
}

// 将对象序列化成一行字符串
export function stringify4diff(o) {
  return stringify(o, {
    replacer: (key, value) => {
      if (typeof value === "bigint") {
        return value.toString() + "n";
      } else if (typeof value === "string") {
        return value + "s";
      } else {
        return value;
      }
    },
  });
}

function isNeedDiffKey(ldata, rdata, lkey, rkey) {
  const val1 = ldata[lkey];
  const val2 = rdata[rkey];

  if (val1 === undefined || val2 === undefined) {
    return false;
  } else if (typeof val1 !== typeof val2) {
    return false;
  } else if (isBaseType(val1) && val1 === val2) {
    return true;
  }

  return stringify4diff(val1) === stringify4diff(val2);
}

function isNeedDiffVal(a, b) {
  if (isNumber(a) && isNumber(b)) {
    return true;
  } else if (typeof a !== typeof b) {
    return false;
  }

  return isObject(a) === isObject(b);
}

function ignoreBlankEqual(a, b) {
  return a.replaceAll(/\s/g, "") === b.replaceAll(/\s/g, "");
}
