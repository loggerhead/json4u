import { type MessageKey } from "@/global";
import { Comparer } from "@/lib/editor/comparer";
import type { Kind, EditorWrapper } from "@/lib/editor/editor";
import { toastErr, toastSucc, toastWarn } from "@/lib/utils";
import { type MyWorker } from "@/lib/worker";
import { type Remote } from "comlink";
import { ArrowDownNarrowWide, ArrowDownWideNarrow, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { create } from "zustand";
import { createContext } from "./context";
import { getStore } from "./utils";

export interface Command {
  name: string;
  Icon?: LucideIcon;
  hidden?: boolean; // hidden in command bar?
  call: () => void | Promise<void | boolean>;
}

export interface EditorState {
  translations?: ReturnType<typeof useTranslations>;
  main?: EditorWrapper;
  secondary?: EditorWrapper;
  comparer?: Comparer;
  worker?: Remote<MyWorker>;
  commands: Command[];

  addCommand: (cmd: Command) => void;
  callCommand: (name: string) => void;
  setTranslations: (translations: ReturnType<typeof useTranslations>) => void;
  getWorker: () => Remote<MyWorker> | undefined;
  setWorker: (worker: Remote<MyWorker>) => void;
  getAnotherEditor: (kind: Kind) => EditorWrapper;
  setEditor: (editor: EditorWrapper) => void;
  isReady: () => boolean;
  compare: () => void;
  resetHighlight: () => void;
}

export const {
  Provider: EditorStoreProvider,
  useStoreCtx: useEditorStoreCtx,
  useStore: useEditorStore,
} = createContext("editorStore", () =>
  create<EditorState>()((set, get) => ({
    // TODO: 给所有命令增加 icon
    commands: [
      {
        name: "format",
        call: async () => {
          const { main } = get();
          const { set } = await main!.parseAndSet(main!.text(), { format: true });
          return set;
        },
      },
      {
        name: "minify",
        call: async () => {
          const { main } = get();
          const { parse } = await main!.parseAndSet(main!.text(), { format: "minify" });
          return parse;
        },
      },
      {
        name: "escape",
        call: async () => {
          const { main, worker } = get();
          const { set } = await main!.parseAndSet(await worker!.escape(main!.text()));
          return set;
        },
      },
      {
        name: "unescape",
        call: async () => {
          const { main, worker } = get();
          const { set } = await main!.parseAndSet(await worker!.unescape(main!.text()));
          return set;
        },
      },
      {
        name: "sortAsc",
        Icon: ArrowDownNarrowWide,
        call: async () => {
          const { main } = get();
          const { parse } = await main!.parseAndSet(main!.text(), { sort: "asc" });
          return parse;
        },
      },
      {
        name: "sortDesc",
        Icon: ArrowDownWideNarrow,
        call: async () => {
          const { main } = get();
          const { parse } = await main!.parseAndSet(main!.text(), { sort: "desc" });
          return parse;
        },
      },
      {
        name: "pythonDictToJSON",
        call: async () => {
          const { main, worker } = get();
          const { parse } = await main!.parseAndSet(await worker!.pythonDictToJSON(main!.text()));
          return parse;
        },
      },
      {
        name: "urlToJson",
        call: async () => {
          const { main, worker } = get();
          const { text, parse } = await worker!.urlToJson(main!.text());
          if (!parse) return parse;
          const { set } = await main!.parseAndSet(text);
          return set;
        },
      },
      {
        name: "compare",
        call: async () => await get().compare(),
      },
      {
        name: "swapLeftRight",
        hidden: true,
        call: async () => {
          const { main, secondary } = get();
          const left = main?.text();
          const right = secondary?.text();
          await main?.parseAndSet(right ?? "", {}, false);
          await secondary?.parseAndSet(left ?? "", {}, false);
          return true;
        },
      },
    ],

    addCommand(cmd: Command) {
      const commands = get().commands;
      const old = commands.find((item) => item.name === cmd.name);

      if (old) {
        Object.assign(old, cmd);
      } else {
        commands.push(cmd);
      }

      set({ commands });
    },

    async callCommand(name: string) {
      const { translations: t, commands, isReady } = get();
      if (!isReady()) {
        console.log("editor is not ready!");
        return;
      }

      const r = await Promise.resolve(commands.find((item) => item.name === name)?.call());

      if (r !== undefined) {
        name = t!(name as MessageKey);
        if (r) {
          // @ts-ignore
          toastSucc(t!("cmd_exec_succ", { name }));
        } else {
          // @ts-ignore
          toastErr(t!(r ? r : "cmd_exec_fail", { name }));
        }
      }
    },

    setTranslations(translations: ReturnType<typeof useTranslations>) {
      set({ translations });
    },

    setWorker(worker: Remote<MyWorker>) {
      set({ worker });
    },

    getWorker() {
      return get().worker;
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
      const { usable, count } = getStore("userStore").getState();
      const { setShowPricingOverlay } = getStore("statusStore").getState();
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
  })),
);

export function useEditor(kind: Kind = "main") {
  return useEditorStore((state) => state[kind]);
}

export function getEditorState() {
  return getStore("editorStore").getState();
}
