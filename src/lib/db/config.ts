import { type ParseOptions } from "@/lib/parser";
import { get, set, del, type UseStore, createStore } from "idb-keyval";
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
  isTouchpad?: boolean;
}

export const defaultConfig: Config = {
  viewMode: ViewMode.Graph,
  enableTextCompare: false,
  rightPanelSize: 70,
  rightPanelCollapsed: false,
  parseOptions: {
    nest: true,
    format: true,
    prettyMaxWidth: 120,
  },
  formatTabWidth: 2,
  prettyFormat: true,
  enableSyncScroll: true,
  isTouchpad: undefined,
};

let globalStore: UseStore | undefined;

export function init() {
  globalStore = createStore("json4u", "kv");
}

export async function safeGet(key: IDBValidKey) {
  try {
    return (await get(key, globalStore)) || null;
  } catch (e) {
    if ((e as unknown as Error).name === "InvalidStateError") {
      console.error("InvalidStateError", e);
      return null;
    } else {
      throw e;
    }
  }
}

export async function safeSet(key: IDBValidKey, value: any) {
  try {
    await set(key, value, globalStore);
  } catch (e) {
    if ((e as unknown as Error).name === "InvalidStateError") {
      console.error("InvalidStateError", e);
    } else {
      throw e;
    }
  }
}

export async function safeDel(key: IDBValidKey) {
  try {
    await del(key, globalStore);
  } catch (e) {
    if ((e as unknown as Error).name === "InvalidStateError") {
      console.error("InvalidStateError", e);
    } else {
      throw e;
    }
  }
}

const storage: StateStorage = {
  getItem: safeGet,
  setItem: safeSet,
  removeItem: safeDel,
};

async function getConfig() {
  const stateStr = await safeGet(keyName);
  try {
    return JSON.parse(stateStr).state as Config;
  } catch (e) {
    console.log("fallback to use default config.");
    return defaultConfig;
  }
}

export { storage, getConfig };
