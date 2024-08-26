"use client";

import { useEffect, useRef } from "react";
import { px2num } from "@/lib/utils";
import { globalStyle, tableId, type TimeoutIdMap, Tooltip } from "./Tooltip";
import { useOnClickExpander } from "./useOnClickExpander";
import { useOnShowTooltip } from "./useOnShowTooltip";
import { useTableHTML } from "./useTableHTML";

export function JsonTable() {
  const tableHTML = useTableHTML();
  const timeoutIdMap: TimeoutIdMap = useRef({});
  const onClickExpander = useOnClickExpander();
  const { onMouseOver, onMouseOut } = useOnShowTooltip(timeoutIdMap);

  useEffect(() => {
    const { paddingBottom } = getComputedStyle(document.getElementById(tableId)!);
    globalStyle.paddingBottom = px2num(paddingBottom);
  }, []);

  return (
    <div id={tableId} className="relative w-full h-full pb-header overflow-auto">
      <div
        className="w-fit h-fit bg-white"
        onClick={onClickExpander}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        dangerouslySetInnerHTML={tableHTML}
      />
      <Tooltip timeoutIdMap={timeoutIdMap} />
      <Background />
    </div>
  );
}

// copy from xyflow <Background>
function Background() {
  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
        zIndex: -1,
      }}
    >
      <pattern
        id="tbl-pattern-1"
        x="5"
        y="5"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
        patternTransform="translate(-1,-1)"
      >
        <path stroke="#eee" strokeWidth="1" d="M10 0 V20 M0 10 H20" />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#tbl-pattern-1)" />
    </svg>
  );
}
