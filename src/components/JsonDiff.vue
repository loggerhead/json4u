<template>
  <div class="grid grid-cols-12 gap-2" @keyup.ctrl.enter.prevent="compare">
    <div class="col-span-6 flex space-x-3">
      <div>
        <button @click="pretty" :class="style.actionButton">
          {{ $t("msg.pretty") }}
        </button>
      </div>
      <div>
        <button @click="minify" :class="style.actionButton">
          {{ $t("msg.minify") }}
        </button>
      </div>
    </div>
    <div class="col-span-4">
      <div class="col-span-4 space-x-3" v-if="hasDiffs">
        <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Left">
          <button @click="scrollToPrevDiff('right')" :class="style.button">
            {{ $t("msg.prev") }}
          </button>
        </span>
        <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Right">
          <button @click="scrollToNextDiff('right')" :class="style.button">
            {{ $t("msg.next") }}
          </button>
        </span>
      </div>
      <div v-else-if="jdd.errmsg" :class="style.alertError">
        {{ jdd.errmsg }}
      </div>
      <div v-else :class="style.alertInfo">
        {{ $t("msg.nodiff") }}
      </div>
    </div>
    <div class="col-span-2 space-x-3 flex justify-end">
      <div class="form-control">
        <label class="cursor-pointer items-center label space-x-1">
          <input
            v-model="syncScroll"
            type="checkbox"
            :checked="syncScroll"
            class="toggle toggle-sm"
          />
          <span class="label-text">{{ $t("msg.syncScroll") }}</span>
        </label>
      </div>
      <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Enter">
        <button @click="compare" :class="style.actionButton">
          {{ $t("msg.compare") }}
        </button>
      </span>
    </div>

    <div class="col-span-12 flex border border-slate-100">
      <div class="w-1/2 h-screen">
        <textarea
          id="left-editor"
          :placeholder="$t('msg.leftPlaceholder')"
        ></textarea>
      </div>
      <div class="w-1/2 h-screen">
        <textarea
          id="right-editor"
          :placeholder="$t('msg.rightPlaceholder')"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.CodeMirror-placeholder {
  font-size: 0.875rem !important;
  color: rgb(148 163 184) !important;
}
</style>

<script setup lang="ts">
import { computed, onMounted, shallowReactive, ref } from "vue";
import { deepEqual } from "fast-equals";
// @ts-ignore
import { diffChars } from "diff/lib/diff/character";
// @ts-ignore
import jsonMap from "json-source-map";
import {
  trace,
  TraceRecord,
  Diff,
  DiffType,
  MORE,
  MISS,
  UNEQ,
  UNEQ_KEY,
} from "../utils/trace";
import { isObject, isBaseType } from "../utils/typeHelper";
import formatJsonString from "../utils/format";
import Editor from "../utils/editor";
import * as style from "./style";

type Side = "left" | "right";
type ScrollDirection = "prev" | "next";

const jdd = shallowReactive({
  llines: [] as Array<string>,
  rlines: [] as Array<string>,
  diffs: [] as Array<[Diff, Diff]>,
  currentDiff: 0,
  startTime: performance.now(),
  errmsg: "",
});

let syncScroll = ref(true);
const hasDiffs = computed(() => jdd.diffs.length > 0);
const timeCost = computed(() => performance.now() - jdd.startTime);

let leftEditor: Editor;
let rightEditor: Editor;

onMounted(() => {
  leftEditor = new Editor("left-editor");
  rightEditor = new Editor("right-editor");

  leftEditor.setPasteListener((event: CodeMirror.EditorChange) => {
    if (
      event.from.line == 0 &&
      event.from.ch == 0 &&
      leftEditor.getText().length > 0
    ) {
      rightEditor.focus();
    }
  });

  rightEditor.setPasteListener((event: CodeMirror.EditorChange) => {
    if (
      event.from.line == 0 &&
      event.from.ch == 0 &&
      leftEditor.getText().length > 0
    ) {
      compare();
    }
  });

  Editor.setSyncScroll(leftEditor, rightEditor, syncScroll);
  leftEditor.focus();
});

window.addEventListener("keydown", (e) => {
  if (!hasDiffs.value) {
    return;
  } else if (!e.ctrlKey) {
    return;
  }

  switch (e.key) {
    case "ArrowLeft":
      // prevent scroll
      e.preventDefault();
      scrollToPrevDiff("right");
      break;
    case "ArrowRight":
      e.preventDefault();
      scrollToNextDiff("right");
      break;
  }
});

function resetJdd() {
  jdd.llines = [];
  jdd.rlines = [];
  jdd.diffs = [];
  jdd.currentDiff = 0;
  jdd.startTime = performance.now();
  jdd.errmsg = "";
}

function pretty() {
  const text = formatJsonString(leftEditor.getText().trim());
  leftEditor.setText(text);
  leftEditor.refresh();
}

function minify() {
  try {
    const obj = jsonMap.parse(leftEditor.getText().trim(), null, {
      bigint: true,
    });
    const text = jsonMap.stringify(obj.data, null, 0).json;
    leftEditor.setText(text);
    leftEditor.refresh();
  } catch (e) {
    if (e instanceof SyntaxError) {
      leftEditor.lint();
      rightEditor.lint();
      jdd.errmsg = (<Error>e).message;
    } else {
      throw e;
    }
  }
}

function compare() {
  try {
    leftEditor.startOperation();
    rightEditor.startOperation();
    resetJdd();
    let lconfig = new TraceRecord();
    let rconfig = new TraceRecord();
    let leftObj: any;
    let rightObj: any;

    measure("format", () => {
      lconfig.out = formatJsonString(leftEditor.getText().trim());
      rconfig.out = formatJsonString(rightEditor.getText().trim());
      leftEditor.setText(lconfig.out);
      rightEditor.setText(rconfig.out);
    });

    measure("parse", () => {
      leftObj = jsonMap.parse(lconfig.out, null, { bigint: true }).data;
      rightObj = jsonMap.parse(rconfig.out, null, { bigint: true }).data;
      trace(lconfig, leftObj);
      trace(rconfig, rightObj);
    });

    measure("diff", () => {
      lconfig.currentPath = [];
      rconfig.currentPath = [];
      diffVal(lconfig, rconfig, leftObj, rightObj);
      processDiffs(lconfig.out, rconfig.out);
    });
  } catch (e) {
    if (e instanceof SyntaxError) {
      leftEditor.lint();
      rightEditor.lint();
      jdd.errmsg = (<Error>e).message;
    } else {
      throw e;
    }
  } finally {
    measure("render", () => {
      leftEditor.endOperation();
      rightEditor.endOperation();
    });
  }
}

function processDiffs(lformated: string, rformated: string) {
  let llines = lformated.split("\n");
  let rlines = rformated.split("\n");

  // 生成差异 vnode
  jdd.diffs.forEach(function (dd: Diff[]) {
    const [ldiff, rdiff] = dd;
    const lline = ldiff.line;
    const rline = rdiff.line;
    const ltext = llines[lline - 1];
    const rtext = rlines[rline - 1];

    leftEditor.addClass(lline, getDiffClass(ldiff.type, "left"));
    rightEditor.addClass(rline, getDiffClass(rdiff.type, "right"));

    // char diff
    if (needCharDiff(ldiff, rdiff)) {
      genCharsDiff(ltext, rtext, ldiff, rdiff);
    }
  });

  if (jdd.diffs.length > 0) {
    // sort by right side line number
    jdd.diffs.sort((a: [Diff, Diff], b: [Diff, Diff]): number => {
      return a[1].line - b[1].line;
    });

    addClickHandler();
    scrollToDiff(jdd.diffs[0], "right");
  }
}

function genCharsDiff(ltext: string, rtext: string, ldiff: Diff, rdiff: Diff) {
  const lline = ldiff.line - 1;
  const rline = rdiff.line - 1;
  let cdiffs = diffChars(ltext, rtext);
  let lpos = 0;
  let rpos = 0;

  for (const d of cdiffs) {
    const v = d.value;

    if (d.added) {
      rightEditor.addClassToRange(rline, rpos, rpos + v.length, getInsClass());
      rpos += v.length;
    } else if (d.removed) {
      leftEditor.addClassToRange(lline, lpos, lpos + v.length, getDelClass());
      lpos += v.length;
    } else {
      lpos += v.length;
      rpos += v.length;
    }
  }
}

function needCharDiff(ldiff: Diff, rdiff: Diff) {
  return (
    (ldiff.type === UNEQ_KEY && rdiff.type === UNEQ_KEY) ||
    (isBaseType(ldiff.val) &&
      isBaseType(rdiff.val) &&
      ldiff.type === UNEQ &&
      rdiff.type === UNEQ)
  );
}

function diffVal(
  config1: TraceRecord,
  config2: TraceRecord,
  data1: any,
  data2: any
) {
  if (Array.isArray(data1) && Array.isArray(data2)) {
    diffArray(config1, config2, data1, data2);
  } else if (isObject(data1) && isObject(data2)) {
    diffObject(config1, config2, data1, data2);
  } else if (data1 !== data2) {
    jdd.diffs.push([
      config1.genDiff(UNEQ, "", data1),
      config2.genDiff(UNEQ, "", data2),
    ]);
  }
}

function diffArray(
  config1: TraceRecord,
  config2: TraceRecord,
  data1: Array<any>,
  data2: Array<any>
) {
  const union = Math.max(data1.length, data2.length);
  const subset = Math.min(data1.length, data2.length);

  for (let i = 0; i < union; i++) {
    if (i < subset) {
      config1.addArrayTrace(i);
      config2.addArrayTrace(i);
      diffVal(config1, config2, data1[i], data2[i]);
      config1.popTrace();
      config2.popTrace();
    } else if (data1.length < data2.length) {
      jdd.diffs.push([
        config1.genDiff(MISS, "", null),
        config2.genDiff(MORE, `[${i}]`, data2[i]),
      ]);
    } else if (data1.length > data2.length) {
      jdd.diffs.push([
        config1.genDiff(MORE, `[${i}]`, data1[i]),
        config2.genDiff(MISS, "", null),
      ]);
    }
  }
}

function diffObject(
  config1: TraceRecord,
  config2: TraceRecord,
  data1: any,
  data2: any
) {
  config1.addTrace();
  config2.addTrace();

  const [subkk, difkk] = splitKeys(data1, data2);

  // iterate over same keys
  subkk.forEach((key) => {
    config1.addTrace(key);
    config2.addTrace(key);
    diffVal(config1, config2, data1[key], data2[key]);
    config1.popTrace();
    config2.popTrace();
  });

  const seen = new Set();

  // iterate over keys which need char compare keys
  for (let i = 0; i < difkk.length; i++) {
    let key1 = difkk[i];

    if (seen.has(key1)) {
      continue;
    }

    for (let j = i + 1; j < difkk.length; j++) {
      let key2 = difkk[j];
      let needDiff = false;

      if (data1.hasOwnProperty(key1) && data2.hasOwnProperty(key2)) {
        needDiff = isNeedDiffKey(data1, data2, key1, key2);
      } else if (data1.hasOwnProperty(key2) && data2.hasOwnProperty(key1)) {
        needDiff = isNeedDiffKey(data1, data2, key2, key1);
      }

      if (needDiff) {
        jdd.diffs.push([
          config1.genDiff(UNEQ_KEY, key1, key1),
          config2.genDiff(UNEQ_KEY, key2, key2),
        ]);
        seen.add(key1);
        seen.add(key2);
        break;
      }
    }
  }

  difkk
    .filter((k) => !seen.has(k))
    .forEach((key) => {
      if (data1.hasOwnProperty(key)) {
        // if data1 has key, data2 don't
        jdd.diffs.push([
          config1.genDiff(MORE, key, data1[key]),
          config2.genDiff(MISS, "", null),
        ]);
      } else {
        jdd.diffs.push([
          config1.genDiff(MISS, "", null),
          config2.genDiff(MORE, key, data2[key]),
        ]);
      }
    });

  config1.popTrace();
  config2.popTrace();
}

function splitKeys(
  data1: Object,
  data2: Object
): [Array<string>, Array<string>] {
  const seen = new Set<string>();
  const sub = new Array<string>();
  const dif = new Array<string>();
  const kk1 = Object.keys(data1);
  const kk2 = Object.keys(data2);
  const n = Math.max(kk1.length, kk2.length);

  for (let i = 0; i < n; i++) {
    const k1 = kk1[i];
    const k2 = kk2[i];

    if (k1 == k2) {
      sub.push(k1);
      seen.add(k1);
      continue;
    }

    if (k1 !== undefined) {
      if (data2.hasOwnProperty(k1)) {
        sub.push(k1);
      } else if (!seen.has(k1)) {
        dif.push(k1);
      }
      seen.add(k1);
    }

    if (k2 !== undefined) {
      if (data1.hasOwnProperty(k2)) {
        sub.push(k2);
      } else if (!seen.has(k2)) {
        dif.push(k2);
      }
      seen.add(k2);
    }
  }

  return [sub, dif];
}

function isNeedDiffKey(
  data1: any,
  data2: any,
  key1: string,
  key2: string
): boolean {
  const val1 = data1[key1];
  const val2 = data2[key2];

  if (val1 === undefined || val2 === undefined) {
    return false;
  } else if (typeof val1 !== typeof val2) {
    return false;
  } else if (isBaseType(val1) && val1 === val2) {
    return true;
  } else if (timeCost.value > 500) {
    console.log("skip key diff because cost of too much time.");
    return false;
  }

  return deepEqual(val1, val2);
}

function addClickHandler() {
  leftEditor.setClickListener((line: number) => {
    handleDiffClick(line, "left");
  });
  rightEditor.setClickListener((line: number) => {
    handleDiffClick(line, "right");
  });
}

function scrollToDiff(dd: [Diff, Diff] | undefined, side: Side) {
  if (dd === undefined) {
    return;
  }

  // 暂时关闭同步滚动
  const old = syncScroll.value;
  syncScroll.value = false;

  const [ldiff, rdiff] = dd;
  leftEditor.scrollTo(ldiff.line);
  rightEditor.scrollTo(rdiff.line);

  // 需要延迟设置
  setTimeout(() => {
    syncScroll.value = old;
  }, 100);

  if (side === "left") {
    handleDiffClick(ldiff.line, side);
  } else if (side === "right") {
    handleDiffClick(rdiff.line, side);
  }
}

function handleDiffClick(lineno: number, side: Side) {
  let editor = side == "left" ? leftEditor : rightEditor;
  const selected = getSeletedClass();
  const isSelected = editor.hasClass(lineno, selected);
  let cnt = 0;

  jdd.diffs
    .map((dd) => {
      const [ldiff, rdiff] = dd;
      const linenoL = ldiff.line;
      const linenoR = rdiff.line;

      // 清除所有 diff 的 selected class
      leftEditor.removeClass(linenoL, selected);
      rightEditor.removeClass(linenoR, selected);

      if (side === "left" && linenoL == lineno) {
        return ["right", linenoR];
      } else if (side === "right" && linenoR == lineno) {
        return ["left", linenoL];
      } else {
        return undefined;
      }
    })
    .filter((pp) => pp)
    .forEach((pp) => {
      const [side, lineno] = pp as [Side, number];
      let e = side == "left" ? leftEditor : rightEditor;
      cnt++;

      if (isSelected) {
        e.removeClass(lineno, selected);
      } else {
        e.addClass(lineno, selected);
      }
    });

  // 点击在不是 diff 的行时，直接返回
  if (cnt === 0) {
    return;
  }

  if (isSelected) {
    editor.removeClass(lineno, selected);
  } else {
    editor.addClass(lineno, selected);
  }
}

// skip same line in one side
function getNextDiff(
  side: Side,
  direction: ScrollDirection
): [Diff, Diff] | undefined {
  const nextIndex = (i: number) => {
    if (direction === "next") {
      if (++i >= jdd.diffs.length) {
        i = 0;
      }
    } else {
      if (--i < 0) {
        i = Math.max(0, jdd.diffs.length - 1);
      }
    }

    return i;
  };

  const start = jdd.currentDiff;
  let end = nextIndex(start);

  for (; start != end; end = nextIndex(end)) {
    const [ldiff1, rdiff1] = jdd.diffs[start];
    const [ldiff2, rdiff2] = jdd.diffs[end];

    if (side === "left") {
      if (ldiff1.line != ldiff2.line) {
        break;
      }
    } else {
      if (rdiff1.line != rdiff2.line) {
        break;
      }
    }
  }

  jdd.currentDiff = end;
  return jdd.diffs[end];
}

function scrollToPrevDiff(side: Side) {
  scrollToDiff(getNextDiff(side, "prev"), side);
}

function scrollToNextDiff(side: Side) {
  scrollToDiff(getNextDiff(side, "next"), side);
}

function getDiffClass(diffType: DiffType, side: Side): string {
  if (diffType === UNEQ || diffType == UNEQ_KEY) {
    return side == "left" ? "bg-blue-100" : "bg-blue-100";
  } else if (diffType === MORE) {
    return side == "left" ? "bg-red-100" : "bg-green-100";
  } else if (diffType === MISS) {
    return side == "left" ? "bg-green-100" : "bg-red-100";
  }

  return "";
}

function getInsClass(): string {
  return "bg-green-300";
}

function getDelClass(): string {
  return "bg-red-300";
}

function getSeletedClass(): string {
  return "!bg-yellow-100";
}

function measure(msg: string, fn: () => void) {
  const now = performance.now();
  fn();
  const cost = performance.now() - now;
  console.log(`${msg} (${Math.trunc(cost)}ms)`);
}
</script>
