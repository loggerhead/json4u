<template>
  <div class="grid grid-cols-12 gap-2">
    <div class="col-span-6 flex space-x-3">
      <div>
        <button @click="pretty()" :class="style.actionButton">
          {{ t("pretty") }}
        </button>
      </div>
      <div>
        <button @click="minify()" :class="style.actionButton">
          {{ t("minify") }}
        </button>
      </div>
    </div>
    <div class="col-span-4">
      <div class="col-span-4 space-x-3" v-if="hasDiffs">
        <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Left">
          <button @click="scrollToPrevDiff('right')" :class="style.button">
            {{ t("prev") }}
          </button>
        </span>
        <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Right">
          <button @click="scrollToNextDiff('right')" :class="style.button">
            {{ t("next") }}
          </button>
        </span>
      </div>
      <div v-else-if="jdd.errmsg" :class="style.alertError">
        {{ jdd.errmsg }}
      </div>
      <div v-else :class="style.alertInfo">
        {{ t("nodiff") }}
      </div>
    </div>
    <div class="col-span-2 space-x-3 flex justify-end">
      <div class="form-control">
        <label class="cursor-pointer items-center label space-x-1">
          <input v-model="syncScroll" type="checkbox" :checked="syncScroll" class="toggle toggle-sm" />
          <span class="label-text">{{ t("syncScroll") }}</span>
        </label>
      </div>
      <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Enter">
        <button @click="compare" :class="style.actionButton">
          {{ t("compare") }}
        </button>
      </span>
    </div>

    <div class="col-span-12 flex border border-slate-100">
      <div class="w-1/2 h-screen">
        <textarea id="left-editor" :placeholder="t('leftPlaceholder')"></textarea>
      </div>
      <div class="w-1/2 h-screen">
        <textarea id="right-editor" :placeholder="t('rightPlaceholder')"></textarea>
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
import * as jsonMap from "json-map-ts";
import * as trace from "../utils/trace";
import { isObject, isBaseType, isComparable } from "../utils/typeHelper";
import formatJsonString from "../utils/format";
import Editor from "../utils/editor";
import { t } from "../utils/i18n";
import * as style from "./style";

type Side = "left" | "right";
type ScrollDirection = "prev" | "next";

const jdd = shallowReactive({
  llines: [] as Array<string>,
  rlines: [] as Array<string>,
  diffs: [] as Array<[trace.Diff, trace.Diff]>,
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
  // must new after mounted
  leftEditor = new Editor("left-editor");
  rightEditor = new Editor("right-editor");

  leftEditor.setPasteListener((event: CodeMirror.EditorChange) => {
    if (event.from.line == 0 && event.from.ch == 0 && leftEditor.getText().length > 0) {
      pretty(leftEditor);
      rightEditor.focus();
    }
  });

  rightEditor.setPasteListener((event: CodeMirror.EditorChange) => {
    if (event.from.line == 0 && event.from.ch == 0 && rightEditor.getText().length > 0) {
      pretty(rightEditor);

      if (leftEditor.getText().length > 0) {
        compare();
      }
    }
  });

  Editor.setSyncScroll(leftEditor, rightEditor, syncScroll);
  leftEditor.focus();
});

window.addEventListener("keydown", (e) => {
  if (!e.ctrlKey) {
    return;
  }

  switch (e.key) {
    case "Enter":
      // prevent input a new line
      e.preventDefault();
      compare();
      break;
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

function handleError(e: Error, side: Side) {
  let errmsg = e.message;

  switch (e.constructor) {
    case jsonMap.DetailedSyntaxError:
      errmsg = t("syntaxError", e);
      break;
    case jsonMap.UnexpectedEndError:
      errmsg = t("unexpectedEndError", e);
      break;
    case jsonMap.UnexpectedTypeError:
      errmsg = t("unexpectedTypeError", e);
      break;
  }

  jdd.errmsg = errmsg;

  if (e instanceof SyntaxError) {
    if (side === "left") {
      leftEditor.lint();
    } else {
      rightEditor.lint();
    }
  } else {
    throw e;
  }
}

function pretty(editor = leftEditor) {
  const text = formatJsonString(editor.getText().trim());
  editor.setText(text);
  editor.refresh();
}

function minify(editor = leftEditor) {
  try {
    const obj = jsonMap.parse(editor.getText().trim());
    const text = jsonMap.stringify(obj.data, null, 0).json;
    editor.setText(text);
    editor.refresh();
  } catch (e: any) {
    handleError(e, editor === leftEditor ? "left" : "right");
  }
}

function resetJdd() {
  jdd.llines = [];
  jdd.rlines = [];
  jdd.diffs = [];
  jdd.currentDiff = 0;
  jdd.startTime = performance.now();
  jdd.errmsg = "";
}

function compare() {
  resetJdd();

  let ltrace = new trace.TraceRecord(leftEditor.getText());
  let rtrace = new trace.TraceRecord(rightEditor.getText());

  measure("parse and diff", () => {
    try {
      ltrace.setParseResult(jsonMap.parse(ltrace.out));
    } catch (e: any) {
      handleError(e, "left");
    }

    try {
      rtrace.setParseResult(jsonMap.parse(rtrace.out));
    } catch (e: any) {
      handleError(e, "right");
    }

    diffVal(ltrace, rtrace, ltrace.data, rtrace.data);
  });

  measure("render", () => {
    leftEditor.startOperation();
    rightEditor.startOperation();
    processDiffs(ltrace, rtrace);
    leftEditor.endOperation();
    rightEditor.endOperation();
  });
}

function processDiffs(ltrace: trace.TraceRecord, rtrace: trace.TraceRecord) {
  jdd.diffs.forEach(function (dd: trace.Diff[]) {
    const [ldiff, rdiff] = dd;
    const lline = ldiff.line;
    const rline = rdiff.line;

    leftEditor.addClass(lline, getDiffClass(ldiff.diffType, "left"));
    rightEditor.addClass(rline, getDiffClass(rdiff.diffType, "right"));

    // char diff
    if (needCharDiff(ltrace, rtrace, ldiff, rdiff)) {
      genCharsDiff(ltrace, rtrace, ldiff, rdiff);
    }
  });

  if (jdd.diffs.length > 0) {
    // sort by right side line number
    jdd.diffs.sort((a: [trace.Diff, trace.Diff], b: [trace.Diff, trace.Diff]): number => {
      return a[1].line - b[1].line;
    });

    addClickHandler();
    scrollToDiff(jdd.diffs[0], "right");
  }
}

function genCharsDiff(ltrace: trace.TraceRecord, rtrace: trace.TraceRecord, ldiff: trace.Diff, rdiff: trace.Diff) {
  let lch;
  let rch;
  let ltext;
  let rtext;

  if (ldiff.diffType === trace.UNEQ_KEY && rdiff.diffType === trace.UNEQ_KEY) {
    lch = ltrace.getKeyPos(ldiff.pointer) - ltrace.getKeyLinePos(ldiff.pointer);
    rch = rtrace.getKeyPos(rdiff.pointer) - rtrace.getKeyLinePos(rdiff.pointer);
    ltext = ltrace.getKey(ldiff.pointer);
    rtext = rtrace.getKey(rdiff.pointer);
  } else {
    lch = ltrace.getValuePos(ldiff.pointer) - ltrace.getValueLinePos(ldiff.pointer);
    rch = rtrace.getValuePos(rdiff.pointer) - rtrace.getValueLinePos(rdiff.pointer);
    ltext = ltrace.getValue(ldiff.pointer);
    rtext = rtrace.getValue(rdiff.pointer);
  }

  let cdiffs = diffChars(ltext, rtext);

  for (const d of cdiffs) {
    const v = d.value;

    if (d.added) {
      rightEditor.addClassToRange(rdiff.line - 1, rch, rch + v.length, getInsClass());
      rch += v.length;
    } else if (d.removed) {
      leftEditor.addClassToRange(ldiff.line - 1, lch, lch + v.length, getDelClass());
      lch += v.length;
    } else {
      lch += v.length;
      rch += v.length;
    }
  }
}

function needCharDiff(ltrace: trace.TraceRecord, rtrace: trace.TraceRecord, ldiff: trace.Diff, rdiff: trace.Diff) {
  return (
    (ldiff.diffType === trace.UNEQ_KEY && rdiff.diffType === trace.UNEQ_KEY) ||
    (ldiff.diffType === trace.UNEQ_VAL && rdiff.diffType === trace.UNEQ_VAL)
  );
}

function diffVal(ltrace: trace.TraceRecord, rtrace: trace.TraceRecord, ldata: any, rdata: any) {
  if (Array.isArray(ldata) && Array.isArray(rdata)) {
    diffArray(ltrace, rtrace, ldata, rdata);
  } else if (isObject(ldata) && isObject(rdata)) {
    diffObject(ltrace, rtrace, ldata, rdata);
  } else if (ldata !== rdata) {
    const t = isComparable(ldata, rdata) ? trace.UNEQ_VAL : trace.UNEQ_TYPE;
    jdd.diffs.push([ltrace.genDiff(t), rtrace.genDiff(t)]);
  }
}

function diffArray(ltrace: trace.TraceRecord, rtrace: trace.TraceRecord, ldata: Array<any>, rdata: Array<any>) {
  const union = Math.max(ldata.length, rdata.length);
  const subset = Math.min(ldata.length, rdata.length);

  for (let i = 0; i < union; i++) {
    if (i < subset) {
      ltrace.push(i);
      rtrace.push(i);
      diffVal(ltrace, rtrace, ldata[i], rdata[i]);
      ltrace.pop();
      rtrace.pop();
    } else if (ldata.length < rdata.length) {
      jdd.diffs.push([ltrace.genDiff(trace.MISS), rtrace.genDiff(trace.MORE, i)]);
    } else if (ldata.length > rdata.length) {
      jdd.diffs.push([ltrace.genDiff(trace.MORE, i), rtrace.genDiff(trace.MISS)]);
    }
  }
}

function diffObject(ltrace: trace.TraceRecord, rtrace: trace.TraceRecord, ldata: any, rdata: any) {
  const [subkk, difkk] = splitKeys(ldata, rdata);

  // iterate over same keys
  subkk.forEach((key) => {
    ltrace.push(key);
    rtrace.push(key);
    diffVal(ltrace, rtrace, ldata[key], rdata[key]);
    ltrace.pop();
    rtrace.pop();
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

      if (ldata.hasOwnProperty(key1) && rdata.hasOwnProperty(key2)) {
        needDiff = isNeedDiffKey(ldata, rdata, key1, key2);
      } else if (ldata.hasOwnProperty(key2) && rdata.hasOwnProperty(key1)) {
        needDiff = isNeedDiffKey(ldata, rdata, key2, key1);
      }

      if (needDiff) {
        jdd.diffs.push([ltrace.genDiff(trace.UNEQ_KEY, key1), rtrace.genDiff(trace.UNEQ_KEY, key2)]);
        seen.add(key1);
        seen.add(key2);
        break;
      }
    }
  }

  difkk
    .filter((k) => !seen.has(k))
    .forEach((key) => {
      if (ldata.hasOwnProperty(key)) {
        // if data1 has key, data2 don't
        jdd.diffs.push([ltrace.genDiff(trace.MORE, key), rtrace.genDiff(trace.MISS)]);
      } else {
        jdd.diffs.push([ltrace.genDiff(trace.MISS), rtrace.genDiff(trace.MORE, key)]);
      }
    });
}

function splitKeys(ldata: Object, rdata: Object): [Array<string>, Array<string>] {
  const seen = new Set<string>();
  const sub = new Array<string>();
  const dif = new Array<string>();
  const kk1 = Object.keys(ldata);
  const kk2 = Object.keys(rdata);
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
      if (rdata.hasOwnProperty(k1)) {
        sub.push(k1);
      } else if (!seen.has(k1)) {
        dif.push(k1);
      }
      seen.add(k1);
    }

    if (k2 !== undefined) {
      if (ldata.hasOwnProperty(k2)) {
        sub.push(k2);
      } else if (!seen.has(k2)) {
        dif.push(k2);
      }
      seen.add(k2);
    }
  }

  return [sub, dif];
}

function isNeedDiffKey(ldata: any, rdata: any, lkey: string, rkey: string): boolean {
  const val1 = ldata[lkey];
  const val2 = rdata[rkey];

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

function scrollToDiff(dd: [trace.Diff, trace.Diff] | undefined, side: Side) {
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
function getNextDiff(side: Side, direction: ScrollDirection): [trace.Diff, trace.Diff] | undefined {
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

function getDiffClass(diffType: trace.DiffType, side: Side): string {
  if ([trace.UNEQ_TYPE, trace.UNEQ_VAL, trace.UNEQ_KEY].includes(diffType)) {
    return side == "left" ? "bg-blue-100" : "bg-blue-100";
  } else if (diffType === trace.MORE) {
    return side == "left" ? "bg-red-100" : "bg-green-100";
  } else if (diffType === trace.MISS) {
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
