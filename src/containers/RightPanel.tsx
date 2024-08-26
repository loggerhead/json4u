"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import Editor from "@/components/editor/loader";
import Graph from "@/components/graph/Graph";
import SwapButton from "@/components/mode/SwapButton";
import { JsonTable } from "@/components/table/JsonTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ViewMode, ViewModeValue } from "@/lib/db/config";
import { useEditorStore, useStatusStore } from "@/stores";
import { AlignHorizontalJustifyCenter, Expand, Shrink, Table2, Text, Waypoints } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { leftPanelId } from "./LeftPanel";

export const rightPanelId = "right-panel";

export default function RightPanel() {
  const { viewMode, setViewMode } = useStatusStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
    })),
  );

  return (
    <Tabs asChild defaultValue={viewMode} value={viewMode} onValueChange={(mode) => setViewMode(mode as ViewModeValue)}>
      <Container>
        <ContainerHeader>
          <TabsList>
            {[ViewMode.Text, ViewMode.Graph, ViewMode.Table].map((mode) => (
              <TabIcon key={mode} viewMode={mode} />
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
  const t = useTranslations();
  const callCommand = useEditorStore((state) => state.callCommand);
  const { enableTextCompare, setEnableTextCompare, enableSyncScroll, setEnableSyncScroll } = useStatusStore(
    useShallow((state) => ({
      enableTextCompare: state.enableTextCompare,
      setEnableTextCompare: state.setEnableTextCompare,
      enableSyncScroll: state.enableSyncScroll,
      setEnableSyncScroll: state.setEnableSyncScroll,
    })),
  );

  return (
    <div className="flex items-center ml-auto space-x-2">
      {viewMode === ViewMode.Text && (
        <>
          <div className="flex items-center rounded-md pl-1 bg-muted text-zinc-600">
            <Switch checked={enableTextCompare} onCheckedChange={setEnableTextCompare} />
            <Button className="px-2" onClick={() => callCommand("compare")}>
              {t(enableTextCompare ? "TextCompare" : "compare")}
            </Button>
          </div>
          <Toggle
            title={t("sync scroll")}
            defaultPressed={enableSyncScroll}
            pressed={enableSyncScroll}
            onPressedChange={setEnableSyncScroll}
          >
            <AlignHorizontalJustifyCenter />
          </Toggle>
          <SwapButton className="px-2" variant="icon-outline" />
        </>
      )}
      <FullScreenButton />
    </div>
  );
}

function FullScreenButton() {
  const t = useTranslations();
  const [fullscreen, setFullscreen] = useState(false);
  const leftPanel = useMemo(
    () => document.getElementById(leftPanelId) as unknown as { expand: () => void; collapse: () => void },
    [],
  );

  return (
    <Button
      title={t(fullscreen ? "shrink_screen" : "expand_screen")}
      className="px-2"
      variant="icon-outline"
      onClick={() => {
        if (fullscreen) {
          setFullscreen(false);
          leftPanel.expand();
        } else {
          setFullscreen(true);
          leftPanel.collapse();
        }
      }}
    >
      {fullscreen ? <Shrink /> : <Expand />}
    </Button>
  );
}

const viewMode2Icon: Record<ViewMode, React.ReactNode> = {
  [ViewMode.Text]: <Text />,
  [ViewMode.Graph]: <Waypoints />,
  [ViewMode.Table]: <Table2 />,
};

function TabIcon({ viewMode }: { viewMode: ViewMode }) {
  const t = useTranslations();
  return (
    <TabsTrigger title={t(viewMode)} value={viewMode} className="text-zinc-600 dark:text-zinc-200">
      {viewMode2Icon[viewMode]}
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
