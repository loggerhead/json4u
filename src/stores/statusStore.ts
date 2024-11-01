import { type Config, defaultConfig, keyName, type ViewMode, type ViewModeValue, storage } from "@/lib/db/config";
import type { RevealPosition } from "@/lib/graph/types";
import { clearHighlight, highlightElement } from "@/lib/graph/utils";
import { type ParseOptions } from "@/lib/parser";
import { type FunctionKeys } from "@/lib/utils";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Position {
  line: number;
  column: number;
}

export type CommandMode = "jq";

export interface StatusState extends Config {
  editorInitCount: number;
  jsonPath: string[]; // the json path where the cursor stays in the left editor which displayed to the status bar
  cursorPosition: Position; // line and column number in the left editor which displayed to the status bar
  selectionLength: number; // selection chars number in the left editor which displayed to the status bar
  commandMode?: CommandMode; // the command mode box displayed above the status bar
  // TODO: 实现 json path 在 editor 和 view mode 同步跳转
  revealPosition: RevealPosition; // id of node in the tree to be revealed in the graph view
  needHighlightRevealPosition: boolean;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  sideNavExpanded?: boolean;
  showPricingOverlay?: boolean;
  unfoldNodeMap: Record<string, boolean>;
  unfoldSiblingsNodeMap: Record<string, boolean>;

  incrEditorInitCount: () => number;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setCommandMode: (mode: CommandMode | undefined) => void;
  setJsonPath: (path: string[]) => void;
  setCursorPosition: (line: number, column: number, selectionLength: number) => void;
  setViewMode: (viewMode: ViewModeValue) => void;
  setEnableTextCompare: (enable: boolean) => void;
  setRightPanelSize: (size: number) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setParseOptions: (options: ParseOptions) => void;
  setRevealPosition: (pos: Partial<RevealPosition>) => void;
  highlightRevealPosition: () => void;
  setEnableSyncScroll: (enable: boolean) => void;
  setSideNavExpanded: (expanded: boolean) => void;
  setShowPricingOverlay: (show: boolean) => void;
  toggleFoldNode: (nodeId: string) => void;
  toggleFoldSibingsNode: (nodeId: string) => void;
  resetFoldStatus: () => void;
}

const initialStates: Omit<StatusState, FunctionKeys<StatusState>> = {
  ...defaultConfig,
  editorInitCount: 0,
  jsonPath: [],
  cursorPosition: { line: 0, column: 0 },
  selectionLength: 0,
  revealPosition: { version: 0, treeNodeId: "", type: "nonLeafNode" },
  needHighlightRevealPosition: false,
  unfoldNodeMap: {},
  unfoldSiblingsNodeMap: {},
};

export const useStatusStore = create<StatusState>()(
  persist(
    (set, get) => ({
      ...initialStates,

      incrEditorInitCount() {
        const { editorInitCount } = get();
        const count = editorInitCount + 1;
        set({ editorInitCount: count });
        return count;
      },

      setLeftPanelWidth(width: number) {
        set({ leftPanelWidth: width });
      },

      setRightPanelWidth(width: number) {
        set({ rightPanelWidth: width });
      },

      setCommandMode(mode: CommandMode | undefined) {
        set({ commandMode: mode });
      },

      setJsonPath(jsonPath: string[]) {
        set({ jsonPath });
      },

      setCursorPosition(line: number, column: number, selectionLength: number) {
        set({ cursorPosition: { line, column }, selectionLength });
      },

      setViewMode(viewMode: ViewModeValue) {
        set({ viewMode: viewMode as ViewMode });
      },

      setEnableTextCompare(enable: boolean) {
        set({ enableTextCompare: enable });
      },

      setRightPanelSize(size: number) {
        set({ rightPanelSize: size });
      },

      setRightPanelCollapsed(collapsed: boolean) {
        set({ rightPanelCollapsed: collapsed });
      },

      setParseOptions(options: ParseOptions) {
        set({ parseOptions: { ...get().parseOptions, ...options } });
      },

      setRevealPosition(pos: Partial<RevealPosition>) {
        const oldPos = get().revealPosition;
        set({
          revealPosition: {
            ...oldPos,
            ...pos,
            version: oldPos.version + 1,
          },
          needHighlightRevealPosition: true,
        });
      },

      highlightRevealPosition() {
        const durationToWaitRenderFinish = 100;
        const {
          revealPosition: { treeNodeId, type },
          needHighlightRevealPosition: needFocusRevealPosition,
        } = get();

        if (needFocusRevealPosition) {
          set({ needHighlightRevealPosition: false });

          setTimeout(() => {
            clearHighlight();

            if (type === "nonLeafNode") {
              const el = document.querySelector(`.graph-node[data-tree-id="${treeNodeId}"]`) as HTMLDivElement;

              if (!el) {
                return;
              }

              el?.click();
            } else {
              const kvEl = document.querySelector(`.graph-kv[data-tree-id="${treeNodeId}"]`);
              const el = kvEl?.querySelector(`.${type === "key" ? "graph-k" : "graph-v"}`) as HTMLDivElement;

              if (!el) {
                return;
              }

              el.click();
              highlightElement(el);
            }
          }, durationToWaitRenderFinish);
        }
      },

      setEnableSyncScroll(enable: boolean) {
        set({ enableSyncScroll: enable });
      },

      setSideNavExpanded(expanded: boolean) {
        set({ sideNavExpanded: expanded });
      },

      setShowPricingOverlay(show: boolean) {
        set({ showPricingOverlay: show });
      },

      toggleFoldNode(nodeId: string) {
        const { unfoldNodeMap } = get();
        unfoldNodeMap[nodeId] = !unfoldNodeMap[nodeId];
        set({ unfoldNodeMap });
      },

      toggleFoldSibingsNode(nodeId: string) {
        const { unfoldSiblingsNodeMap } = get();
        unfoldSiblingsNodeMap[nodeId] = !unfoldSiblingsNodeMap[nodeId];
        set({ unfoldSiblingsNodeMap });
      },

      resetFoldStatus() {
        set({ unfoldNodeMap: {}, unfoldSiblingsNodeMap: {} });
      },
    }),
    {
      name: keyName,
      skipHydration: true,
      partialize: (state) => ({
        ...Object.fromEntries(Object.keys(defaultConfig).map((k) => [k, state[k as keyof typeof state]])),
        editorInitCount: state.editorInitCount,
      }),
      storage: createJSONStorage(() => storage),
    },
  ),
);

export function getStatusState() {
  return useStatusStore.getState();
}
