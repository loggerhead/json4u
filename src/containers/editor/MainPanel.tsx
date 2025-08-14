"use client";

import { useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import ModePanel from "@/containers/editor/mode/ModePanel";
import { setupGlobalGraphStyle } from "@/lib/graph/layout";
import { cn } from "@/lib/utils";
import { px2num } from "@/lib/utils";
import { initLogger } from "@/lib/utils";
import { type MyWorker } from "@/lib/worker/worker";
import { useConfigFromCookies } from "@/stores/hook";
import { useStatusStore } from "@/stores/statusStore";
import { useUserStore } from "@/stores/userStore";
import { wrap } from "comlink";
import { useShallow } from "zustand/shallow";
import { CollapseHint } from "./CollapseHint";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import StatusBar from "./StatusBar";

const leftPanelId = "left-panel";
const rightPanelId = "right-panel";
initLogger();

export default function MainPanel() {
  const cc = useConfigFromCookies();
  const {
    rightPanelSize,
    rightPanelCollapsed,
    leftPanelCollapsed,
    setRightPanelSize,
    setRightPanelCollapsed,
    setLeftPanelCollapsed,
  } = useStatusStore(
    useShallow((state) => ({
      rightPanelSize: state._hasHydrated ? state.rightPanelSize : cc.rightPanelSize,
      rightPanelCollapsed: state._hasHydrated ? state.rightPanelCollapsed : cc.rightPanelCollapsed,
      leftPanelCollapsed: state._hasHydrated ? state.leftPanelCollapsed : cc.leftPanelCollapsed,
      setRightPanelSize: state.setRightPanelSize,
      setRightPanelCollapsed: state.setRightPanelCollapsed,
      setLeftPanelCollapsed: state.setLeftPanelCollapsed,
    })),
  );
  const [showLeftCollapseHint, setShowLeftCollapseHint] = useState(false);
  const [showRightCollapseHint, setShowRightCollapseHint] = useState(false);

  useObserveResize();

  // see https://github.com/bvaughn/react-resizable-panels/issues/128#issuecomment-1523343548
  return (
    <div className="relative w-full h-full flex flex-col">
      <ResizablePanelGroup
        className="flex-grow"
        direction="horizontal"
        onLayout={(layout) => setRightPanelSize(layout[1])}
      >
        <ResizablePanel
          id={leftPanelId}
          defaultSize={100 - rightPanelSize}
          minSize={10}
          collapsible
          onCollapse={() => {
            setLeftPanelCollapsed(true);
            setShowLeftCollapseHint(false);
          }}
          onExpand={() => setLeftPanelCollapsed(false)}
          onResize={(size) => setShowLeftCollapseHint(5 < size && size < 15)}
          className={cn(leftPanelCollapsed && "w-0 hidden transition-all duration-300 ease-in-out")}
          // The preview displayed by the hover provider of the monaco editor
          // will be obscured by the right panel, so this style needs to be set.
          style={{ overflow: "visible" }}
        >
          <div className="relative h-full w-full">
            {showLeftCollapseHint && <CollapseHint side="left" />}
            <LeftPanel />
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className={cn("hover:bg-blue-600", (leftPanelCollapsed || rightPanelCollapsed) && "bg-blue-200 w-2")}
        />
        <ResizablePanel
          id={rightPanelId}
          defaultSize={rightPanelSize}
          minSize={10}
          collapsible
          onCollapse={() => {
            setRightPanelCollapsed(true);
            setShowRightCollapseHint(false);
          }}
          onExpand={() => setRightPanelCollapsed(false)}
          onResize={(size) => setShowRightCollapseHint(5 < size && size < 15)}
          className={cn(rightPanelCollapsed && "transition-all duration-300 ease-in-out")}
        >
          <div className="relative h-full w-full">
            {showRightCollapseHint && <CollapseHint side="right" />}
            <RightPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <ModePanel />
      <Separator />
      <StatusBar />
      <WidthMeasure />
    </div>
  );
}

function useObserveResize() {
  const { setLeftPanelWidth, setRightPanelWidth } = useStatusStore(
    useShallow((state) => ({
      setLeftPanelWidth: state.setLeftPanelWidth,
      setRightPanelWidth: state.setRightPanelWidth,
    })),
  );

  useEffect(() => {
    const leftPanel = document.getElementById(leftPanelId)!;
    const rightPanel = document.getElementById(rightPanelId)!;
    setLeftPanelWidth(leftPanel.offsetWidth);
    setRightPanelWidth(rightPanel.offsetWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === leftPanelId) {
          setLeftPanelWidth(entry.contentRect.width);
        } else {
          setRightPanelWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(leftPanel);
    resizeObserver.observe(rightPanel);
  }, []);
}

function WidthMeasure() {
  useInitial();

  return (
    <div id="width-measure" className="absolute invisible graph-node">
      <div className="graph-kv">
        <div className="graph-k">
          <span>{"measure"}</span>
        </div>
        <div className="graph-v" />
      </div>
    </div>
  );
}

function useInitial() {
  const cc = useConfigFromCookies();
  const { user, updateActiveOrder } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      updateActiveOrder: state.updateActiveOrder,
    })),
  );

  useEffect(() => {
    updateActiveOrder(user);
    useStatusStore.setState({ _hasHydrated: true, ...cc });

    // initial worker
    window.rawWorker = new Worker(new URL("@/lib/worker/worker.ts", import.meta.url));
    window.worker = wrap<MyWorker>(window.rawWorker);
    window.addEventListener("beforeunload", () => {
      console.l("worker is terminated.");
      window.rawWorker?.terminate();
    });

    // measure graph style
    const el = document.getElementById("width-measure")!;
    const span = el.querySelector("span")!;
    const { lineHeight } = getComputedStyle(span);
    const { borderWidth } = getComputedStyle(el);
    const { paddingLeft, paddingRight } = getComputedStyle(el.querySelector(".graph-kv")!);
    const { marginRight, maxWidth: maxKeyWidth } = getComputedStyle(el.querySelector(".graph-k")!);
    const { maxWidth: maxValueWidth } = getComputedStyle(el.querySelector(".graph-v")!);
    const measured = {
      fontWidth: span.offsetWidth / span.textContent!.length,
      kvHeight: px2num(lineHeight),
      padding: px2num(paddingLeft) + px2num(paddingRight),
      borderWidth: px2num(borderWidth),
      kvGap: px2num(marginRight),
      maxKeyWidth: px2num(maxKeyWidth),
      maxValueWidth: px2num(maxValueWidth),
    };

    setupGlobalGraphStyle(measured);
    window.worker.setupGlobalGraphStyle(measured);
    console.l("finished measuring graph base style:", measured);
  }, []);
}
