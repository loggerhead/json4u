<template>
  <div class="grid grid-cols-12 gap-2">
    <div class="col-span-6 flex space-x-3">
      <button @click="pretty()" :class="style.actionButton">
        {{ t("pretty") }}
      </button>
      <button @click="minify()" :class="style.actionButton">
        {{ t("minify") }}
      </button>
    </div>
    <div class="col-span-6 flex">
      <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Enter">
        <button @click="compare" :class="style.actionButton">
          {{ t("compare") }}
        </button>
      </span>
      <div class="form-control ml-3">
        <label class="cursor-pointer items-center label space-x-1">
          <input v-model="syncScroll" type="checkbox" :checked="syncScroll" class="toggle toggle-sm" />
          <span class="label-text">{{ t("syncScroll") }}</span>
        </label>
      </div>
      <div class="ml-12">
        <div class="space-x-3" v-if="hasDiffs">
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
    </div>

    <div class="col-span-12 flex border border-slate-100">
      <div class="w-1/2 h-editor">
        <textarea id="left-editor" :placeholder="t('leftPlaceholder')"></textarea>
      </div>
      <div class="w-1/2 h-editor">
        <textarea id="right-editor" :placeholder="t('rightPlaceholder')"></textarea>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.CodeMirror-placeholder {
  color: rgb(148 163 184) !important;
}

.editor-hover {
  border: 1px solid #2098d1;
}
</style>

<script setup lang="ts">
import { computed, onMounted, shallowReactive, ref } from "vue";
import * as jsonMap from "json-map-ts";
import * as diff from "../utils/diff";
import TraceRecord from "../utils/trace";
import Editor from "../utils/editor";
import formatJsonString from "../utils/format";
import { t } from "../utils/i18n";
import * as style from "./style";

type Side = "left" | "right";
type ScrollDirection = "prev" | "next";

const jdd = shallowReactive({
  diffs: [] as Array<[diff.Diff, diff.Diff]>,
  currentDiff: 0,
  errmsg: "",
});

let syncScroll = ref(true);
const hasDiffs = computed(() => jdd.diffs.length > 0);

let leftEditor = new Editor();
let rightEditor = new Editor();

onMounted(async () => {
  if (typeof window === "undefined") {
    console.log("skip onMounted when SSG");
    return;
  }

  await leftEditor.setupCM("left-editor");
  await rightEditor.setupCM("right-editor");

  function leftPasteHandler() {
    pretty(leftEditor);
    rightEditor.focus();
  }

  function rightPasteHandler() {
    pretty(rightEditor);

    if (leftEditor.getText().length > 0) {
      compare();
    }
  }

  leftEditor.setChangesListener(leftPasteHandler);
  rightEditor.setChangesListener(rightPasteHandler);

  Editor.setSyncScroll(leftEditor, rightEditor, syncScroll);
  leftEditor.focus();

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
  jdd.diffs = [];
  jdd.currentDiff = 0;
  jdd.errmsg = "";
}

function compare() {
  resetJdd();

  measure("parse and diff", () => {
    let ltrace = new TraceRecord(leftEditor.getText());
    let rtrace = new TraceRecord(rightEditor.getText());

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

    jdd.diffs = new diff.Handler(ltrace, rtrace).compare();
  });

  measure("render", () => {
    leftEditor.startOperation();
    rightEditor.startOperation();
    leftEditor.clearClass();
    rightEditor.clearClass();
    processDiffs();
    leftEditor.endOperation();
    rightEditor.endOperation();
  });
}

function processDiffs() {
  jdd.diffs.forEach((dd) => {
    const [ldiff, rdiff] = dd;
    const lline = ldiff.line;
    const rline = rdiff.line;

    leftEditor.addClass(lline, getDiffClass(ldiff.diffType, "left"));
    rightEditor.addClass(rline, getDiffClass(rdiff.diffType, "right"));

    for (const cdiff of ldiff.charDiffs) {
      leftEditor.addClassToRange(lline, cdiff.start, cdiff.end, getDiffClass(cdiff.diffType));
    }

    for (const cdiff of rdiff.charDiffs) {
      rightEditor.addClassToRange(rline, cdiff.start, cdiff.end, getDiffClass(cdiff.diffType));
    }
  });

  addClickHandler();
  scrollToDiff(jdd.diffs[0], "right");
}

function addClickHandler() {
  leftEditor.setClickListener((line: number) => {
    handleDiffClick(line, "left");
  });
  rightEditor.setClickListener((line: number) => {
    handleDiffClick(line, "right");
  });
}

function scrollToDiff(dd: [diff.Diff, diff.Diff] | undefined, side: Side) {
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
function getNextDiff(side: Side, direction: ScrollDirection): [diff.Diff, diff.Diff] | undefined {
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

function getDiffClass(diffType: diff.DiffType, side?: Side): string {
  switch (diffType) {
    case diff.UNEQ:
    case diff.MORE:
      return side == "left" ? "bg-red-100" : "bg-green-100";
    case diff.CHAR_INS:
      return "bg-green-300";
    case diff.CHAR_DEL:
      return "bg-red-300";
  }

  return "";
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
