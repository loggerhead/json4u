"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainPanel from "@/containers/MainPanel";
import SideNav from "@/containers/SideNav";
import { init as dbInit } from "@/lib/db/config";
import { init as jqInit } from "@/lib/jq";
import { type MyWorker } from "@/lib/worker";
import {
  EditorStoreProvider,
  StatusStoreProvider,
  TreeStoreProvider,
  useEditorStore,
  useStatusStoreCtx,
} from "@/stores";
import { ErrorBoundary } from "@sentry/react";
import { wrap } from "comlink";

export default function Page() {
  return (
    <main className="w-screen h-screen">
      <ErrorBoundary>
        <TooltipProvider delayDuration={0}>
          <StoreProvider>
            <Main />
          </StoreProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </main>
  );
}

function StoreProvider({ children }: React.ComponentProps<"div">) {
  return (
    <StatusStoreProvider>
      <TreeStoreProvider>
        <EditorStoreProvider>{children}</EditorStoreProvider>
      </TreeStoreProvider>
    </StatusStoreProvider>
  );
}

function Main() {
  const inited = useInit();
  return inited ? (
    <div className="flex h-full w-full">
      <SideNav />
      <Separator orientation="vertical" />
      <MainPanel />
    </div>
  ) : (
    <Loading />
  );
}

function useInit() {
  const [hydrated, setHydrated] = useState(false);
  const setWorker = useEditorStore((state) => state.setWorker);
  const useStatusStore = useStatusStoreCtx();

  useEffect(() => {
    dbInit();
    jqInit();

    Promise.resolve(useStatusStore.persist.rehydrate()).then(() => setHydrated(true));

    const worker = new Worker(new URL("@/lib/worker.ts", import.meta.url));
    const workerProxy = wrap<MyWorker>(worker);
    setWorker(workerProxy);

    window.addEventListener("beforeunload", () => {
      console.log("worker is terminated.");
      worker.terminate();
    });
  }, []);

  return hydrated;
}
