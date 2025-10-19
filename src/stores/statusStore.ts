import { type Config, defaultConfig, keyName, type ViewMode, type ViewModeValue, storage } from "@/lib/db/config";
import type { RevealFrom, RevealPosition, RevealTarget } from "@/lib/graph/types";
import { newRevealPosition } from "@/lib/graph/utils";
import { GraphNodeId } from "@/lib/idgen";
import type { ParseOptions } from "@/lib/parser";
import type { FunctionKeys } from "@/lib/utils";
import { includes } from "lodash-es";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Position {
  line: number;
  column: number;
}

export interface TreeEdit {
  treeNodeId: string;
  target: RevealTarget;
  value: string;
  version?: number;
}

export type CommandMode = "jq" | "json_path";

export interface StatusState extends Config {
  _hasHydrated: boolean;
  editorInitCount: number;
  cursorPosition: Position; // line and column number in the left editor which displayed to the status bar
  selectionLength: number; // selection chars number in the left editor which displayed to the status bar
  commandMode?: CommandMode; // the command mode box displayed above the status bar
  revealPosition: RevealPosition; // id of node in the tree to be revealed in the graph view
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  rightPanelCollapsed: boolean;
  leftPanelCollapsed: boolean;
  sideNavExpanded?: boolean;
  showPricingOverlay?: boolean;
  unfoldNodeMap: Record<GraphNodeId, boolean>;
  unfoldSiblingsNodeMap: Record<GraphNodeId, boolean>;
  editQueue: Array<TreeEdit>;
  tableEditModePos?: { row: number; col: number };

  incrEditorInitCount: () => number;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setCommandMode: (mode: CommandMode | undefined) => void;
  setCursorPosition: (line: number, column: number, selectionLength: number) => void;
  setViewMode: (viewMode: ViewModeValue) => void;
  setEnableTextCompare: (enable: boolean) => void;
  setRightPanelSize: (size: number) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  setParseOptions: (options: ParseOptions) => void;
  setRevealPosition: (pos: Partial<RevealPosition>) => void;
  isNeedReveal: (scene: "editor" | "graph" | "table") => boolean;
  setEnableSyncScroll: (enable: boolean) => void;
  setSideNavExpanded: (expanded: boolean) => void;
  setFixSideNav: (fix: boolean) => void;
  setShowPricingOverlay: (show: boolean) => void;
  setIsTouchpad: (isTouchpad: boolean) => void;
  addToEditQueue: (...edits: TreeEdit[]) => void;
  clearEditQueue: () => void;
  setTableEditModePos: (pos?: { row: number; col: number }) => void;
  toggleFoldNode: (id: GraphNodeId) => void;
  toggleFoldSiblingsNode: (id: GraphNodeId) => void;
  resetFoldStatus: () => void;
}

const initialStates: Omit<StatusState, FunctionKeys<StatusState>> = {
  ...defaultConfig,
  _hasHydrated: false,
  editorInitCount: 0,
  cursorPosition: { line: 0, column: 0 },
  selectionLength: 0,
  revealPosition: newRevealPosition(0),
  unfoldNodeMap: {},
  unfoldSiblingsNodeMap: {},
  editQueue: [],
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

      setLeftPanelCollapsed(collapsed: boolean) {
        set({ leftPanelCollapsed: collapsed });
      },

      setParseOptions(options: ParseOptions) {
        set({ parseOptions: { ...get().parseOptions, ...options } });
      },

      // set reveal position will cause:
      // 1. `setCenter` in `useRevealNode` to be called.
      // 2. `setCenter` will change viewport and cause `onViewportChange` to be called.
      setRevealPosition(pos: Partial<RevealPosition>) {
        const oldPos = get().revealPosition;
        const needUpdate = !(oldPos.target === pos.target && oldPos.treeNodeId === pos.treeNodeId);

        if (needUpdate) {
          set({
            revealPosition: {
              ...oldPos,
              ...pos,
              version: oldPos.version + 1,
            },
          });
        }
      },

      isNeedReveal(scene: "editor" | "graph" | "table") {
        const {
          enableSyncScroll,
          revealPosition: { from },
        } = get();

        let ok = false;

        if (enableSyncScroll) {
          ok = !from.startsWith(scene);
        } else if (scene === "editor") {
          ok = includes<RevealFrom>(["statusBar"], from);
        } else if (scene === "graph") {
          ok = includes<RevealFrom>(["statusBar", "search", "graphButton"], from);
        } else if (scene === "table") {
          ok = includes<RevealFrom>(["statusBar", "search"], from);
        }

        return ok;
      },

      setEnableSyncScroll(enable: boolean) {
        set({ enableSyncScroll: enable });
      },

      setSideNavExpanded(expanded: boolean) {
        set({ sideNavExpanded: expanded });
      },

      setFixSideNav(fix: boolean) {
        set({ fixSideNav: fix });
      },

      setShowPricingOverlay(show: boolean) {
        set({ showPricingOverlay: show });
      },

      setIsTouchpad(isTouchpad: boolean) {
        set({ isTouchpad });
      },

      addToEditQueue(...edits: TreeEdit[]) {
        const { editQueue } = get();
        editQueue.push(...edits);
        set({ editQueue: [...editQueue] });
      },

      clearEditQueue() {
        set({ editQueue: [] });
      },

      setTableEditModePos(pos?: { row: number; col: number }) {
        set({ tableEditModePos: pos });
      },

      toggleFoldNode(id: GraphNodeId) {
        const { unfoldNodeMap } = get();
        unfoldNodeMap[id] = !unfoldNodeMap[id];
        set({ unfoldNodeMap });
      },

      toggleFoldSiblingsNode(id: GraphNodeId) {
        const { unfoldSiblingsNodeMap } = get();
        unfoldSiblingsNodeMap[id] = !unfoldSiblingsNodeMap[id];
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
