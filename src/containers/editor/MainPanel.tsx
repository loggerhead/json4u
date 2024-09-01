"use client";

import { useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import ModePanel from "@/containers/editor/mode/ModePanel";
import { globalStyle } from "@/lib/graph/layout";
import { cn } from "@/lib/utils";
import { px2num } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useShallow } from "zustand/react/shallow";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import StatusBar from "./StatusBar";

const leftPanelId = "left-panel";
const rightPanelId = "right-panel";

export default function MainPanel() {
  const { rightPanelSize, rightPanelCollapsed, setRightPanelSize, setRightPanelCollapsed } = useStatusStore(
    useShallow((state) => ({
      rightPanelSize: state.rightPanelSize,
      rightPanelCollapsed: state.rightPanelCollapsed,
      setRightPanelSize: state.setRightPanelSize,
      setRightPanelCollapsed: state.setRightPanelCollapsed,
    })),
  );

  useObserveResize();

  // TODO: fix the performance problem with resize when there are a large number of nodes in the table view
  // see https://github.com/bvaughn/react-resizable-panels/issues/128#issuecomment-1523343548
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ResizablePanelGroup
        className="flex-grow"
        direction="horizontal"
        onLayout={(layout) => setRightPanelSize(layout[1])}
      >
        <ResizablePanel
          id={leftPanelId}
          ref={(ref) => {
            window.leftPanelHandle = ref;
          }}
          collapsible
          defaultSize={100 - rightPanelSize}
          minSize={0}
        >
          <LeftPanel />
        </ResizablePanel>
        <ResizableHandle withHandle className={cn("hover:bg-blue-600", rightPanelCollapsed && "w-3")} />
        <ResizablePanel
          id={rightPanelId}
          defaultSize={rightPanelSize}
          minSize={10}
          collapsible={true}
          onCollapse={() => setRightPanelCollapsed(true)}
          onExpand={() => setRightPanelCollapsed(false)}
          className={cn(rightPanelCollapsed && "transition-all duration-300 ease-in-out")}
        >
          <RightPanel />
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

    return () => {
      resizeObserver.unobserve(leftPanel);
      resizeObserver.unobserve(rightPanel);
    };
  }, []);
}

function WidthMeasure() {
  useEffect(() => {
    const el = document.getElementById("width-measure")!;
    const span = el.querySelector("span")!;
    const { lineHeight } = getComputedStyle(span);
    const { borderWidth } = getComputedStyle(el);
    const { paddingLeft, paddingRight } = getComputedStyle(el.querySelector(".graph-kv")!);
    const { marginRight, maxWidth: maxKeyWidth } = getComputedStyle(el.querySelector(".graph-k")!);
    const { maxWidth: maxValueWidth } = getComputedStyle(el.querySelector(".graph-v")!);

    globalStyle.fontWidth = span.offsetWidth / span.textContent!.length;
    globalStyle.kvHeight = px2num(lineHeight);
    globalStyle.padding = px2num(paddingLeft) + px2num(paddingRight);
    globalStyle.borderWidth = px2num(borderWidth);
    globalStyle.kvGap = px2num(marginRight);
    globalStyle.maxKeyWidth = px2num(maxKeyWidth);
    globalStyle.maxValueWidth = px2num(maxValueWidth);
  }, []);

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
