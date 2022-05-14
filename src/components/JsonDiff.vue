<template>
  <div class="grid grid-cols-12 gap-2">
    <div class="col-span-6 flex space-x-2">
      <button @click="pretty()" class="actionButton">
        {{ t("pretty") }}
      </button>
      <button @click="minify()" class="actionButton">
        {{ t("minify") }}
      </button>
      <button @click="escape()" class="actionButton invisible lg:visible">
        {{ t("escape") }}
      </button>
      <button @click="unescape()" class="actionButton invisible lg:visible">
        {{ t("unescape") }}
      </button>
    </div>
    <div class="col-span-6 flex space-x-2">
      <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Enter">
        <button @click="compare" class="actionButton">
          {{ t("compare") }}
        </button>
      </span>
      <div class="dropdown">
        <label tabindex="0"><img class="btn-like h-full inline-block" src="/gear.svg" alt="Settings" /></label>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-64">
          <li>
            <label class="flex cursor-pointer w-full space-x-1">
              <input type="checkbox" class="toggle toggle-sm" v-model="conf.syncScroll" />
              <span class="label-text">{{ t("syncScroll") }}</span>
            </label>
          </li>
          <li>
            <label class="flex cursor-pointer w-full space-x-1">
              <input type="checkbox" class="toggle toggle-sm" v-model="conf.showRightEditor" />
              <span class="label-text">{{ t("showRightEditor") }}</span>
            </label>
          </li>
          <li>
            <label class="flex cursor-pointer w-full space-x-1">
              <input type="checkbox" class="toggle toggle-sm" v-model="conf.autoFormat" />
              <span class="label-text">{{ t("autoFormat") }}</span>
            </label>
          </li>
          <li>
            <label class="flex cursor-pointer w-full space-x-1">
              <input type="checkbox" class="toggle toggle-sm" v-model="conf.ignoreBlank" />
              <span class="label-text">{{ t("ignoreBlank") }}</span>
            </label>
          </li>
        </ul>
      </div>

      <div class="ml-12">
        <div v-if="jdd.errmsg" class="alertError">
          {{ jdd.errmsg }}
        </div>
        <div class="space-x-2" v-else-if="hasDiffs">
          <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Left">
            <button @click="scrollToPrevDiff('right')" class="button">
              {{ t("prev") }}
            </button>
          </span>
          <span class="tooltip tooltip-bottom z-10" data-tip="Ctrl + Right">
            <button @click="scrollToNextDiff('right')" class="button">
              {{ t("next") }}
            </button>
          </span>
        </div>
        <div v-else-if="isCompared" class="alertInfo">
          {{ t("nodiff") }}
        </div>
      </div>
    </div>

    <div class="col-span-12 flex border border-slate-100">
      <div class="h-editor_full lg:h-editor" :class="conf.showRightEditor ? 'w-1/2' : 'w-full'">
        <textarea id="left-editor" class="hidden" :placeholder="t('leftPlaceholder')"></textarea>
      </div>
      <div class="h-editor_full lg:h-editor" :class="conf.showRightEditor ? 'w-1/2' : 'w-0'">
        <textarea id="right-editor" class="hidden" :placeholder="t('rightPlaceholder')"></textarea>
      </div>
    </div>
  </div>
</template>

<!-- astro 对 scope 支持有 bug -->
<style lang="scss">
.CodeMirror-placeholder {
  color: rgb(148 163 184) !important;
  font-size: 1.5rem !important;
  text-align: center;
  line-height: 50vh !important;
}

.CodeMirror {
  // 占位，避免 editor focus 时抖动一下
  border: 1px solid transparent;
}

.editor-hover {
  border: 1px solid #2099d180;
}

.btn-like:hover {
  cursor: pointer;
  background-color: #00000020;
}

// 实现前景色效果
.selected-line {
  outline: 10px inset #00000010;
  outline-offset: -11px;
}
</style>

<script lang="ts" setup>
import { computed, onMounted, reactive, shallowReactive, watch } from "vue";
import * as jsonMap from "json-map-ts";
import * as diff from "../utils/diff";
import Editor from "../utils/editor";
import formatJsonString from "../utils/format";
import { setupLang, t } from "../utils/i18n";
import { OptionNum } from "../utils/typeHelper";
import { Config } from "../utils/config";

type Side = diff.Side;
type ScrollDirection = "prev" | "next";

const props = defineProps({
  lang: String,
});

setupLang(props.lang);

const jdd = shallowReactive({
  diffs: [] as diff.DiffPair[],
  currentDiff: 0,
  errmsg: "",
  isTextCompared: false,
});

let conf = reactive(new Config());

const hasDiffs = computed(() => jdd.diffs.length > 0);
const isCompared = computed(() => Editor.isCompared());

let leftEditor = new Editor();
let rightEditor = new Editor();

onMounted(async () => {
  if (typeof window === "undefined") {
    console.log("skip onMounted when SSG");
    return;
  }

  // 从 localStorage 读配置
  if (localStorage.getItem("config")) {
    Object.assign(conf, JSON.parse(localStorage.getItem("config") as string));
  }

  await leftEditor.init("left-editor");
  await rightEditor.init("right-editor");

  function leftPasteHandler() {
    if (conf.autoFormat) {
      pretty(leftEditor);
    }
  }

  function rightPasteHandler() {
    if (conf.autoFormat) {
      pretty(rightEditor);
    }

    if (leftEditor.getText().length > 0 && rightEditor.getText().length > 0) {
      compare();
    }
  }

  leftEditor.setChangesListener(leftPasteHandler, resetJdd);
  rightEditor.setChangesListener(rightPasteHandler, resetJdd);

  Editor.setSyncScroll(leftEditor, rightEditor, conf);
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
        scrollToPrevDiff(diff.RIGHT);
        break;
      case "ArrowRight":
        e.preventDefault();
        scrollToNextDiff(diff.RIGHT);
        break;
    }
  });
});

// 监听配置项变化，写入 localStorage
watch(conf, (v) => {
  localStorage.setItem("config", JSON.stringify(v));
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

  if (jdd.isTextCompared) {
    errmsg += t("period") + t("textCompared");
  }
  jdd.errmsg = errmsg;

  if (e instanceof SyntaxError) {
    (side === diff.LEFT ? leftEditor : rightEditor).lint();
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
    handleError(e, editor === leftEditor ? diff.LEFT : diff.RIGHT);
  }
}

function escape(editor = leftEditor) {
  let text = editor.getText().trim();
  text = text
    .replace(/[\\]/g, "\\\\")
    .replace(/[\"]/g, '\\"')
    .replace(/[\/]/g, "\\/")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t");
  editor.setText(text);
  editor.refresh();
}

function unescape(editor = leftEditor) {
  let text = editor.getText().trim();
  text = text
    .replace(/[\\]n/g, "\n")
    .replace(/[\\]'/g, "'")
    .replace(/[\\]"/g, '"')
    .replace(/[\\]&/g, "\&")
    .replace(/[\\]r/g, "\r")
    .replace(/[\\]t/g, "\t")
    .replace(/[\\]b/g, "\b")
    .replace(/[\\]f/g, "\f");
  editor.setText(text);
  editor.refresh();
}

function resetJdd() {
  leftEditor.reset();
  rightEditor.reset();
  jdd.diffs = [];
  jdd.currentDiff = 0;
  jdd.errmsg = "";
  jdd.isTextCompared = false;
}

function compare() {
  resetJdd();

  measure("parse and diff", () => {
    const ltext = leftEditor.getText();
    const rtext = rightEditor.getText();
    const diffsOrErr = diff.compare(ltext, rtext);

    if (diffsOrErr instanceof diff.Error) {
      jdd.isTextCompared = true;
      handleError(diffsOrErr.error, diffsOrErr.side);
      jdd.diffs = diff.textCompare(ltext, rtext, conf.ignoreBlank);
    } else {
      jdd.diffs = diffsOrErr as diff.DiffPair[];
    }
  });

  measure("render", () => {
    leftEditor.startOperation();
    rightEditor.startOperation();
    processDiffs();
    Editor.incCompareVersion();
    leftEditor.endOperation();
    rightEditor.endOperation();
  });
}

function processDiffs() {
  jdd.diffs.forEach((dd) => {
    const [ldiff, rdiff] = dd;
    const lline = ldiff?.index;
    const rline = rdiff?.index;

    leftEditor.addClass(lline, getDiffClass(ldiff?.diffType));
    rightEditor.addClass(rline, getDiffClass(rdiff?.diffType));
    leftEditor.mark(lline);
    rightEditor.mark(rline);

    for (const cdiff of ldiff?.charDiffs || []) {
      leftEditor.mark(lline, cdiff.start, cdiff.end, getDiffClass(cdiff.diffType));
    }

    for (const cdiff of rdiff?.charDiffs || []) {
      rightEditor.mark(rline, cdiff.start, cdiff.end, getDiffClass(cdiff.diffType));
    }
  });

  if (!jdd.isTextCompared) {
    addClickHandler();
    scrollToDiff(jdd.diffs[0], diff.RIGHT);
  }
}

function addClickHandler() {
  leftEditor.setClickListener((line: number) => {
    scrollToDiffLine(line, diff.LEFT, true);
  });
  rightEditor.setClickListener((line: number) => {
    scrollToDiffLine(line, diff.RIGHT, true);
  });
}

function scrollToDiffLine(line: number, side: Side, isClick?: boolean) {
  const diffs = jdd.diffs.filter((dd) => {
    const [ldiff, rdiff] = dd;
    const linenoL = ldiff?.index;
    const linenoR = rdiff?.index;

    if (side === diff.LEFT && line === linenoL) {
      return true;
    } else if (side === diff.RIGHT && line === linenoR) {
      return true;
    } else {
      return false;
    }
  });

  if (diffs.length === 0) {
    return;
  }

  scrollToDiff(diffs[0], side, isClick);
}

function scrollToDiff(dd: diff.DiffPair | undefined, side: Side, isClick?: boolean) {
  if (dd === undefined) {
    return;
  }

  // 暂时关闭同步滚动
  const old = conf.syncScroll;
  conf.syncScroll = false;

  const [ldiff, rdiff] = dd;
  if (side !== diff.LEFT || !isClick) {
    leftEditor.scrollTo(ldiff?.index);
  }
  if (side !== diff.RIGHT || !isClick) {
    rightEditor.scrollTo(rdiff?.index);
  }

  // 需要延迟设置
  setTimeout(() => {
    conf.syncScroll = old;
  }, 100);

  if (side === diff.LEFT) {
    handleDiffClick(ldiff?.index, side);
  } else if (side === diff.RIGHT) {
    handleDiffClick(rdiff?.index, side);
  }
}

function handleDiffClick(lineno: OptionNum, side: Side) {
  if (lineno === undefined) {
    return;
  }

  let editor = side == diff.LEFT ? leftEditor : rightEditor;
  const selected = getSeletedClass();
  let cnt = 0;

  jdd.diffs
    .map((dd) => {
      const [ldiff, rdiff] = dd;
      const linenoL = ldiff?.index;
      const linenoR = rdiff?.index;

      // 清除所有 diff 的 selected class
      leftEditor.removeClass(linenoL, selected);
      rightEditor.removeClass(linenoR, selected);

      if (side === diff.LEFT && linenoL == lineno) {
        return [diff.RIGHT, linenoR];
      } else if (side === diff.RIGHT && linenoR == lineno) {
        return [diff.LEFT, linenoL];
      } else {
        return undefined;
      }
    })
    .filter((pp) => pp)
    .forEach((pp) => {
      const [side, lineno] = pp as [Side, number];
      let e = side == diff.LEFT ? leftEditor : rightEditor;
      cnt++;
      e.addClass(lineno, selected);
    });

  // 点击在不是 diff 的行时，直接返回
  if (cnt === 0) {
    return;
  }

  editor.addClass(lineno, selected);
}

// skip same line in one side
function getNextDiff(side: Side, direction: ScrollDirection): diff.DiffPair | undefined {
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

    if (side === diff.LEFT) {
      if (ldiff1?.index != ldiff2?.index) {
        break;
      }
    } else {
      if (rdiff1?.index != rdiff2?.index) {
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

function getDiffClass(diffType: diff.DiffType | undefined): string {
  switch (diffType) {
    case diff.INS:
      return "bg-green-100";
    case diff.DEL:
      return "bg-red-100";
    case diff.PART_INS:
      return "bg-green-300";
    case diff.PART_DEL:
      return "bg-red-300";
  }

  return "";
}

function getSeletedClass(): string {
  return "selected-line";
}

function measure(msg: string, fn: () => void) {
  const now = performance.now();
  fn();
  const cost = performance.now() - now;
  console.log(`${msg} (${Math.trunc(cost)}ms)`);
}
</script>
