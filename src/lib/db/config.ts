import { ParseOptions } from "@/lib/parser";
import { get, set, del, UseStore, createStore } from "idb-keyval";
import { type StateStorage } from "zustand/middleware";

export const keyName = "config";

export enum ViewMode {
  Text = "text",
  Graph = "graph",
  Table = "table",
}

export type ViewModeValue = `${ViewMode}`;

export interface Config {
  viewMode: ViewMode;
  enableTextCompare: boolean;
  rightPanelSize: number;
  rightPanelCollapsed: boolean;
  parseOptions: ParseOptions;
  formatTabWidth: number;
  prettyFormat: boolean;
  enableSyncScroll: boolean; // the left and right side editors scroll in sync
}

export const defaultConfig: Config = {
  viewMode: ViewMode.Graph,
  enableTextCompare: false,
  rightPanelSize: 50,
  rightPanelCollapsed: false,
  parseOptions: {
    nest: true,
    format: true,
    prettyMaxWidth: 120,
  },
  formatTabWidth: 2,
  prettyFormat: true,
  enableSyncScroll: true,
};

let globalStore: UseStore | undefined;

export function init() {
  globalStore = createStore("json4u", "kv");
}

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name, globalStore)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value, globalStore);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name, globalStore);
  },
};

async function getConfig() {
  const stateStr = await get(keyName);
  const state = JSON.parse(stateStr);
  return state.state as Config;
}

export { storage, getConfig };
