import { type Config, defaultConfig, keyName, type ViewMode, type ViewModeValue, storage } from "@/lib/db/config";
import { type ParseOptions } from "@/lib/parser";
import { type FunctionKeys } from "@/lib/utils";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createContext } from "./context";
import { getStore } from "./utils";

interface Position {
  line: number;
  column: number;
}

interface IdWithVersion {
  id: string;
  version: number; // version is used to re-trigger when assigned same id by caller
}

export type CommandMode = "jq";

export interface StatusState extends Config {
  jsonPath: string[]; // the json path where the cursor stays in the left editor which displayed to the status bar
  cursorPosition: Position; // line and column number in the left editor which displayed to the status bar
  selectionLength: number; // selection chars number in the left editor which displayed to the status bar
  commandOpen: boolean; // the open status of command search button
  commandMode?: CommandMode; // the command mode box displayed above the status bar
  // TODO: 实现 json path 在 editor 和 view mode 同步跳转
  revealId: IdWithVersion; // id of node in the tree to be revealed in the graph view
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  sideNavExpanded?: boolean;
  showPricingOverlay?: boolean;

  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setCommandMode: (mode: CommandMode | undefined) => void;
  setCommandOpen: (open: boolean) => void;
  setJsonPath: (path: string[]) => void;
  setCursorPosition: (line: number, column: number, selectionLength: number) => void;
  setViewMode: (viewMode: ViewModeValue) => void;
  setEnableTextCompare: (enable: boolean) => void;
  setRightPanelSize: (size: number) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setParseOptions: (options: ParseOptions) => void;
  setRevealId: (id: string) => void;
  setEnableSyncScroll: (enable: boolean) => void;
  setSideNavExpanded: (expanded: boolean) => void;
  setShowPricingOverlay: (show: boolean) => void;
}

const initialStates: Omit<StatusState, FunctionKeys<StatusState>> = {
  ...defaultConfig,
  jsonPath: [],
  cursorPosition: { line: 0, column: 0 },
  selectionLength: 0,
  commandOpen: false,
  revealId: { id: "", version: 0 },
};

export const {
  Provider: StatusStoreProvider,
  useStoreCtx: useStatusStoreCtx,
  useStore: useStatusStore,
} = createContext("statusStore", () =>
  create<StatusState>()(
    persist(
      (set, get) => ({
        ...initialStates,

        setLeftPanelWidth(width: number) {
          set({ leftPanelWidth: width });
        },

        setRightPanelWidth(width: number) {
          set({ rightPanelWidth: width });
        },

        setCommandMode(mode: CommandMode | undefined) {
          set({ commandMode: mode });
        },

        setCommandOpen(open: boolean) {
          set({ commandOpen: open });
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

        setRevealId(id: string) {
          const { version } = get().revealId;
          set({ revealId: { id, version: version + 1 } });
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
      }),
      {
        name: keyName,
        skipHydration: true,
        partialize: (state) =>
          Object.fromEntries(Object.keys(defaultConfig).map((k) => [k, state[k as keyof typeof state]])),
        storage: createJSONStorage(() => storage),
      },
    ),
  ),
);

export function getStatusState() {
  return getStore("statusStore").getState();
}
