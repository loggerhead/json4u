import type { StoreName, Stores } from "./types";

export function getStore<T extends StoreName>(storeName: T): Stores[T] {
  if (typeof window !== "undefined") {
    return (window as Stores)[storeName];
  }
  throw new Error("miss window");
}
