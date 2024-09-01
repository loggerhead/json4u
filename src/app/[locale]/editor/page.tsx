"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainPanel from "@/containers/editor/MainPanel";
import SideNav from "@/containers/editor/sidenav";
import { PricingOverlay } from "@/containers/pricing";
import { init as dbInit } from "@/lib/db/config";
import { version } from "@/lib/env";
import { init as jqInit } from "@/lib/jq";
import { type MyWorker } from "@/lib/worker";
import StoresProvider from "@/stores/StoresProvider";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStoreCtx } from "@/stores/statusStore";
import { ErrorBoundary } from "@sentry/react";
import { wrap } from "comlink";

export default function Page() {
  return (
    <main className="w-screen h-screen">
      <ErrorBoundary>
        <TooltipProvider delayDuration={0}>
          <StoresProvider>
            <Main />
          </StoresProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </main>
  );
}

function Main() {
  const inited = useInit();

  return inited ? (
    <div className="flex h-full w-full">
      <SideNav />
      <Separator orientation="vertical" />
      <MainPanel />
      <PricingOverlay />
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
    console.log(`JSON For You version is ${version}`);
    console.log("无人扶我青云志，我自踏雪至山巅！");

    // async init
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
