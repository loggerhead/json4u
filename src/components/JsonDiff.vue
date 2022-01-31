<template>
  <div class="grid grid-cols-12 gap-4" @keyup.ctrl.enter.prevent="compare">
    <div class="col-span-6"></div>
    <div class="col-span-4">
      <n-space v-if="hasDiffs">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="scrollToPrevDiff('right')"> Prev </n-button>
          </template>
          Left arrow key
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="scrollToNextDiff('right')"> Next </n-button>
          </template>
          Right arrow key
        </n-tooltip>
      </n-space>
      <n-alert v-else title="" class="max-w-xs">No diffs</n-alert>
    </div>
    <div class="col-span-2 flex justify-end">
      <n-tooltip class="justify-end" trigger="hover">
        <template #trigger>
          <n-button @click="compare"> Compare </n-button>
        </template>
        Ctrl + Enter
      </n-tooltip>
    </div>

    <div class="col-span-12 flex border border-slate-100">
      <div id="left-editor" class="w-1/2 h-screen"></div>
      <div id="right-editor" class="w-1/2 h-screen"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowReactive } from "vue";
import { diffChars } from "diff/lib/diff/character";
import { deepEqual } from "fast-equals";
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

type Side = "left" | "right";
type ScrollDirection = "prev" | "next";

const jdd = shallowReactive({
  llines: [],
  rlines: [],
  diffs: [],
  currentDiff: 0,
  startTime: performance.now(),
} as {
  llines: Array<string>;
  rlines: Array<string>;
  diffs: Array<[Diff, Diff]>;
  currentDiff: number;
  startTime: number;
});

const hasDiffs = computed(() => jdd.diffs.length > 0);
const timeCost = computed(() => performance.now() - jdd.startTime);

let leftEditor: Editor;
let rightEditor: Editor;

onMounted(() => {
  leftEditor = new Editor("left-editor");
  rightEditor = new Editor("right-editor");
  // TODO: delete
  compare();
});

window.addEventListener("keydown", (e) => {
  if (!hasDiffs.value) {
    return;
  }

  switch (e.key) {
    // TODO: change to ctrl
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
}

function compare() {
  // TODO: delete
  leftEditor.setText(
    `{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true, "null": null, "a_null": null, "another_null": "null check", "object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}`
  );
  rightEditor.setText(
    `{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false, "null": null, "a_null":88, "another_null": null, "object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}`
  );

  try {
    leftEditor.startOperation();
    rightEditor.startOperation();
    let lconfig = new TraceRecord();
    let rconfig = new TraceRecord();
    let leftObj: any;
    let rightObj: any;

    measure("format", () => {
      resetJdd();
      lconfig.out = formatJsonString(leftEditor.getText().trim());
      rconfig.out = formatJsonString(rightEditor.getText().trim());

      leftEditor.setText(lconfig.out);
      rightEditor.setText(rconfig.out);
      leftEditor.lint();
      rightEditor.lint();

      leftObj = JSON.parse(lconfig.out);
      rightObj = JSON.parse(rconfig.out);
      trace(lconfig, leftObj);
      trace(rconfig, rightObj);

      lconfig.currentPath = [];
      rconfig.currentPath = [];
    });

    measure("diff", () => {
      diffVal(lconfig, rconfig, leftObj, rightObj);
      processDiffs(lconfig.out, rconfig.out);
    });
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

    // TODO:
    // addClickHandler(lnodes, rnodes);
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

  const remain = [];

  // iterate over keys which need char compare keys
  for (let i = 0; i < difkk.length; i++) {
    let key1 = difkk[i];
    let needDiff = false;

    for (let j = i + 1; j < difkk.length; j++) {
      let key2 = difkk[j];

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
        break;
      }
    }

    if (!needDiff) {
      remain.push(key1);
    }
  }

  remain.forEach((key) => {
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

function scrollToDiff(dd: [Diff, Diff], side: Side) {
  if (dd === undefined) {
    return;
  }

  const [ldiff, rdiff] = dd;
  leftEditor.scrollTo(ldiff.line);
  rightEditor.scrollTo(rdiff.line);

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
        return null;
      }
    })
    .filter((pp) => pp)
    .forEach((pp: [Side, number]) => {
      const [side, lineno] = pp;
      let e = side == "left" ? leftEditor : rightEditor;

      if (isSelected) {
        e.removeClass(lineno, selected);
      } else {
        e.addClass(lineno, selected);
      }
    });

  if (isSelected) {
    editor.removeClass(lineno, selected);
  } else {
    editor.addClass(lineno, selected);
  }
}

// skip same line in one side
function getNextDiff(side: Side, direction: ScrollDirection) {
  const nextIndex = (i) => {
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

  const nextIdx = start === end ? -1 : end;
  if (nextIdx < 0) {
    return undefined;
  }

  jdd.currentDiff = nextIdx;
  return jdd.diffs[nextIdx];
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
