"use client";

import * as React from "react";
import { useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Button } from "@/components/ui/button";
import ViewSearchInput from "@/components/ui/search/ViewSearchInput";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from "@/containers/editor/editor";
import Graph from "@/containers/editor/graph/Graph";
import SwapButton from "@/containers/editor/mode/SwapButton";
import { JsonTable } from "@/containers/editor/table/JsonTable";
import { ViewMode, ViewModeValue } from "@/lib/db/config";
import { useEditorStore } from "@/stores/editorStore";
import { useConfigFromCookies } from "@/stores/hook";
import { useStatusStore } from "@/stores/statusStore";
import { Expand, Shrink, Table2, Text, Waypoints } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";

export default function RightPanel() {
  const cc = useConfigFromCookies();
  const { viewMode, setViewMode } = useStatusStore(
    useShallow((state) => ({
      viewMode: state._hasHydrated ? state.viewMode : cc.viewMode,
      setViewMode: state.setViewMode,
    })),
  );

  return (
    <Tabs asChild defaultValue={viewMode} value={viewMode} onValueChange={(mode) => setViewMode(mode as ViewModeValue)}>
      <Container>
        <ContainerHeader>
          <TabsList>
            {[ViewMode.Text, ViewMode.Graph, ViewMode.Table].map((mode) => (
              <TabIcon key={mode} viewMode={mode} className="icon" />
            ))}
          </TabsList>
          <Buttons viewMode={viewMode} />
        </ContainerHeader>
        <ContainerContent>
          <TabView viewMode={ViewMode.Text}>
            <Editor kind="secondary" />
          </TabView>
          <TabView viewMode={ViewMode.Graph}>
            <Graph />
          </TabView>
          <TabView viewMode={ViewMode.Table}>
            <JsonTable />
          </TabView>
        </ContainerContent>
      </Container>
    </Tabs>
  );
}

function Buttons({ viewMode }: { viewMode: ViewMode }) {
  const cc = useConfigFromCookies();
  const t = useTranslations();
  const runCommand = useEditorStore((state) => state.runCommand);
  const { enableTextCompare, setEnableTextCompare } = useStatusStore(
    useShallow((state) => ({
      enableTextCompare: state._hasHydrated ? state.enableTextCompare : cc.enableTextCompare,
      setEnableTextCompare: state.setEnableTextCompare,
    })),
  );

  return (
    <div className="flex items-center ml-auto space-x-2">
      {viewMode === ViewMode.Text && (
        <>
          <div className="flex items-center rounded-md pl-1 bg-muted text-zinc-600">
            <Switch checked={enableTextCompare} onCheckedChange={setEnableTextCompare} />
            <Button className="px-2" onClick={() => runCommand("compare")}>
              {t(enableTextCompare ? "TextCompare" : "compare")}
            </Button>
          </div>
          <SwapButton variant="icon-outline" className="px-2" />
        </>
      )}
      {viewMode === ViewMode.Graph && <ViewSearchInput />}
      <FullScreenButton />
    </div>
  );
}

function FullScreenButton() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setShow(true);
  }, []);

  return show ? <ClientFullScreenButton /> : null;
}

function ClientFullScreenButton() {
  const t = useTranslations();
  const [fullscreen, setFullscreen] = useState(false);
  const Icon = fullscreen ? Shrink : Expand;

  const el = document.documentElement;
  const requestFullscreenFn =
    el?.requestFullscreen ||
    (el as any).webkitRequestFullscreen ||
    (el as any).mozRequestFullScreen ||
    (el as any).msRequestFullscreen;
  const exitFullscreenFn =
    document.exitFullscreen ||
    (document as any).webkitExitFullscreen ||
    (document as any).mozCancelFullScreen ||
    (document as any).msExitFullscreen;

  if (!requestFullscreenFn || !exitFullscreenFn) {
    return null;
  }

  return (
    <Button
      title={t(fullscreen ? "shrink_screen" : "expand_screen")}
      className="px-2"
      variant="icon-outline"
      onClick={async () => {
        if (fullscreen) {
          await exitFullscreenFn.call(document);
          setFullscreen(false);
        } else {
          await requestFullscreenFn.call(el);
          setFullscreen(true);
        }
      }}
    >
      <Icon className="icon" />
    </Button>
  );
}

const viewMode2Icon = {
  [ViewMode.Text]: Text,
  [ViewMode.Graph]: Waypoints,
  [ViewMode.Table]: Table2,
};

function TabIcon({ viewMode, className }: { viewMode: ViewMode; className: string }) {
  const t = useTranslations();
  const Icon = viewMode2Icon[viewMode];

  return (
    <TabsTrigger title={t(viewMode)} value={viewMode} className="text-zinc-600 dark:text-zinc-200">
      <Icon className={className} />
    </TabsTrigger>
  );
}

function TabView({ viewMode, children }: { viewMode: ViewMode; children: React.ReactNode }) {
  // `data-[state=inactive]` used for fix https://github.com/radix-ui/primitives/issues/1155#issuecomment-2041571341
  return (
    <TabsContent value={viewMode} className="relative w-full h-full m-0 data-[state=inactive]:hidden" forceMount>
      {children}
    </TabsContent>
  );
}
