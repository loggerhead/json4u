import { type MessageKey } from "@/global";
import { Comparer } from "@/lib/editor/comparer";
import type { Kind, EditorWrapper } from "@/lib/editor/editor";
import { toastErr, toastSucc, toastWarn } from "@/lib/utils";
import { sendGAEvent } from "@next/third-parties/google";
import { ArrowDownNarrowWide, ArrowDownWideNarrow, type LucideIcon } from "lucide-react";
import type { TranslationValues, useTranslations } from "next-intl";
import { create } from "zustand";
import { getStatusState } from "./statusStore";
import { getUserState } from "./userStore";

export interface Command {
  id: MessageKey;
  Icon?: LucideIcon;
  hidden?: boolean; // hidden in command bar?
  run: () => void | Promise<void | boolean>;
}

export interface EditorState {
  translations?: ReturnType<typeof useTranslations>;
  main?: EditorWrapper;
  secondary?: EditorWrapper;
  comparer?: Comparer;
  commands: Command[];

  runCommand: (id: MessageKey) => void;
  setTranslations: (translations: ReturnType<typeof useTranslations>) => void;
  getAnotherEditor: (kind: Kind) => EditorWrapper;
  setEditor: (editor: EditorWrapper) => void;
  isReady: () => boolean;
  compare: () => void;
  resetHighlight: () => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  commands: [
    {
      id: "format",
      run: async () => {
        const { main } = get();
        const { set } = await main!.parseAndSet(main!.text(), { format: true });
        return set;
      },
    },
    {
      id: "minify",
      run: async () => {
        const { main } = get();
        const { parse } = await main!.parseAndSet(main!.text(), { format: "minify" });
        return parse;
      },
    },
    {
      id: "escape",
      run: async () => {
        const { main } = get();
        const { set } = await main!.parseAndSet(await window.worker.escape(main!.text()));
        return set;
      },
    },
    {
      id: "unescape",
      run: async () => {
        const { main } = get();
        const { set } = await main!.parseAndSet(await window.worker.unescape(main!.text()));
        return set;
      },
    },
    {
      id: "sortAsc",
      Icon: ArrowDownNarrowWide,
      run: async () => {
        const { main } = get();
        const { parse } = await main!.parseAndSet(main!.text(), { sort: "asc" });
        return parse;
      },
    },
    {
      id: "sortDesc",
      Icon: ArrowDownWideNarrow,
      run: async () => {
        const { main } = get();
        const { parse } = await main!.parseAndSet(main!.text(), { sort: "desc" });
        return parse;
      },
    },
    {
      id: "pythonDictToJSON",
      run: async () => {
        const { main } = get();
        const { parse } = await main!.parseAndSet(await window.worker.pythonDictToJSON(main!.text()));
        return parse;
      },
    },
    {
      id: "urlToJson",
      run: async () => {
        const { main } = get();
        const { text, parse } = await window.worker.urlToJSON(main!.text());
        if (!parse) return parse;
        const { set } = await main!.parseAndSet(text);
        return set;
      },
    },
    {
      id: "compare",
      run: async () => await get().compare(),
    },
    {
      id: "swapLeftRight",
      hidden: true,
      run: async () => {
        const { main, secondary } = get();
        const left = main?.text();
        const right = secondary?.text();
        await main?.parseAndSet(right ?? "", {}, false);
        await secondary?.parseAndSet(left ?? "", {}, false);
        return true;
      },
    },
    {
      id: "show_jq",
      run: () => getStatusState().setCommandMode("jq"),
    },
    {
      id: "show_json_path",
      run: () => getStatusState().setCommandMode("json_path"),
    },
  ],

  async runCommand(id: MessageKey) {
    const { translations: t, commands, isReady } = get();
    if (!isReady()) {
      console.log("editor is not ready!");
      return;
    }

    const r = await Promise.resolve(commands.find((item) => item.id === id)?.run());
    let isSucc = true;
    const name = t!(id);

    if (r !== undefined) {
      if (r) {
        // @ts-ignore
        toastSucc(t!("cmd_exec_succ", { name }));
      } else {
        // @ts-ignore
        toastErr(t!(r ? r : "cmd_exec_fail", { name }));
        isSucc = false;
      }
    }

    sendGAEvent("event", "cmd_usage", { name, isSucc });
  },

  setTranslations(translations: ReturnType<typeof useTranslations>) {
    set({ translations });
  },

  getAnotherEditor(kind: Kind) {
    return (kind === "main" ? get().secondary : get().main)!;
  },

  setEditor(editor: EditorWrapper) {
    let { main, secondary } = get();

    if (editor.kind === "main") {
      main = editor;
    } else {
      secondary = editor;
    }

    set({
      [editor.kind]: editor,
      comparer: main && secondary ? new Comparer(main, secondary) : undefined,
    });
  },

  isReady() {
    const { main, secondary } = get();
    return !!(main && secondary);
  },

  async compare() {
    const { translations: t, comparer } = get();
    const { usable, count } = getUserState();
    const { setShowPricingOverlay } = getStatusState();
    const { diffPairs, isTextCompare } = await comparer!.compare();
    const hasDiff = diffPairs.length > 0;
    const showPricing = hasDiff && isTextCompare && !usable("textComparison");

    if (showPricing) {
      setShowPricingOverlay(true);
    } else {
      comparer!.highlightDiff(diffPairs, isTextCompare);
    }

    if (hasDiff) {
      isTextCompare && count("textComparison");
      // @ts-ignore
      toastWarn(t!(isTextCompare ? "with_text_diff" : "with_diff"), "compare");
    } else {
      // @ts-ignore
      toastSucc(t!("no_diff"), "compare");
    }
  },

  resetHighlight() {
    get().comparer?.reset();
  },
}));

export function useEditor(kind: Kind = "main") {
  return useEditorStore((state) => state[kind]);
}

export function getEditorState() {
  return useEditorStore.getState();
}

export function t(key: string, values?: TranslationValues): string {
  const fn = getEditorState().translations;
  const k = key as MessageKey;
  return fn ? fn(k, values) : key;
}
