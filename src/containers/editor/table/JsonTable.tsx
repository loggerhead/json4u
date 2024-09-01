"use client";

import { useEffect, useRef } from "react";
import Background from "@/components/Background";
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
