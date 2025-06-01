"use client";

import * as React from "react";
import { useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
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
import { Expand, Shrink, Table2, Text, Waypoints, Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useTheme } from "next-themes";
import Button from "@/containers/editor/sidenav/Button";

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex items-center ml-auto space-x-2">
      {viewMode === ViewMode.Text && (
        <>
          <div className="flex items-center rounded-md pl-1 bg-muted text-zinc-600">
            <Switch checked={enableTextCompare} onCheckedChange={setEnableTextCompare} />
            <Button className="px-2" icon={null} title={t(enableTextCompare ? "TextCompare" : "compare")} onClick={() => runCommand("compare")} />
          </div>
          <SwapButton variant="icon-outline" className="px-2" />
        </>
      )}
      {viewMode === ViewMode.Graph && <ViewSearchInput />}
      <ThemeButton />
      <FullScreenButton />
    </div>
  );
}

function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const isDark = theme === "dark";
  return (
    <Button
      className="px-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
      icon={isDark ? <Moon className="icon" /> : <Sun className="icon" />}
      // TODO: add title
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}

function FullScreenButton() {
  const t = useTranslations();
  const [fullscreen, setFullscreen] = useState(false);
  const Icon = fullscreen ? Shrink : Expand;

  return (
    <Button
      className="px-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
      icon={<Icon className="icon" />}
      title={t(fullscreen ? "shrink_screen" : "expand_screen")}
      onClick={() => {
        if (fullscreen) {
          setFullscreen(false);
          window.leftPanelHandle?.expand();
        } else {
          setFullscreen(true);
          window.leftPanelHandle?.collapse();
        }
      }}
    />
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
