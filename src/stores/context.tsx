import { createContext as createReactContext, useContext, useEffect, useState } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { type StoreName } from "./types";

// https://docs.pmnd.rs/zustand/guides/nextjs
export const createContext = <TStore extends UseBoundStore<StoreApi<any>>>(
  name: StoreName,
  createStore: () => TStore,
  afterInitial?: (store: TStore) => void,
) => {
  const Context = createReactContext<TStore | null>(null);

  const Provider = (props: { children?: React.ReactNode }) => {
    const [store] = useState(() => createStore());

    if (typeof window !== "undefined") {
      window[name] = store;
    }

    useEffect(() => {
      if (afterInitial && store) {
        afterInitial(store);
      }
    }, [store]);

    return <Context.Provider value={store}>{props.children}</Context.Provider>;
  };

  const useStoreCtx = () => {
    const store = useContext(Context);
    if (!store) {
      throw new Error("Missing provider for context");
    }
    return store;
  };

  return {
    Provider,
    useStoreCtx,
    useStore: ((selector: Parameters<TStore>[0]) => useStoreCtx()(selector)) as TStore,
  };
};
