"use client";

import * as React from "react";
import { useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import Editor from "@/containers/editor/editor/loader";
import Graph from "@/containers/editor/graph/Graph";
import SwapButton from "@/containers/editor/mode/SwapButton";
import { JsonTable } from "@/containers/editor/table/JsonTable";
import { ViewMode, ViewModeValue } from "@/lib/db/config";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { AlignHorizontalJustifyCenter, Expand, Shrink, Table2, Text, Waypoints } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

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
            <AlignHorizontalJustifyCenter className="icon" />
          </Toggle>
          <SwapButton variant="icon-outline" className="px-2" />
        </>
      )}
      <FullScreenButton />
    </div>
  );
}

function FullScreenButton() {
  const t = useTranslations();
  const [fullscreen, setFullscreen] = useState(false);
  const Icon = fullscreen ? Shrink : Expand;

  return (
    <Button
      title={t(fullscreen ? "shrink_screen" : "expand_screen")}
      className="px-2"
      variant="icon-outline"
      onClick={() => {
        if (fullscreen) {
          setFullscreen(false);
          window.leftPanelHandle?.expand();
        } else {
          setFullscreen(true);
          window.leftPanelHandle?.collapse();
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
