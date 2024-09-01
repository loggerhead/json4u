"use client";

import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editorStore";
import { type TooltipPosition, useTreeStore } from "@/stores/treeStore";
import { capitalize } from "lodash-es";
import { useTranslations } from "next-intl";

export const intervalToShow = 500;
export const intervalToHide = 500;
export const tableId = "json-table";
export const tooltipId = "tbl-tooltip";

export const globalStyle: Record<string, number> = {
  paddingBottom: 0, // padding bottom of the table container
  margin: 10, // margin to the target
};

export type TimeoutIdMap = MutableRefObject<Record<string, NodeJS.Timeout | undefined>>;

interface TooltipProps {
  timeoutIdMap: TimeoutIdMap;
}

// TODO 同级取值预览
export function Tooltip({ timeoutIdMap }: TooltipProps) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0, side: "top" });
  const editor = useEditor();
  const tooltipContent = useTreeStore((state) => state.tooltipContent);
  const path = (tooltipContent?.path ?? []).map(({ key }) => key);

  const onMouseEnter = useCallback(() => {
    resetTimeout(timeoutIdMap);
  }, [timeoutIdMap]);

  const onMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (tooltipContent) {
      const table = document.getElementById(tableId);
      const target = document.getElementById(tooltipContent.targetId);
      const tooltip = document.getElementById(tooltipId);
      const position = tooltipContent.computePosition(table, target, tooltip);

      if (position) {
        setPosition(position);
      }

      setVisible(!!position);
    } else {
      setVisible(false);
    }
  }, [tooltipContent]);

  return (
    <div
      id={tooltipId}
      data-side={position.side}
      className={cn(!visible && "invisible")}
      style={{
        left: position.left,
        top: position.top,
        [`margin${capitalize(position.side)}`]: globalStyle.margin,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ol className="overflow-auto text-nowrap">
        {tooltipContent?.path.map(({ nodeType, key }, i) => (
          <li key={i}>
            <Button
              size="xs"
              title={t("reveal position in editor")}
              className={`tooltip-${nodeType}`}
              onClick={() => editor?.revealJsonPath(path, i)}
            >
              {nodeType === "object" ? "{}" : "[]"}
            </Button>
            <span className="tooltip-key">{key}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function resetTimeout(timeoutIdMap: TimeoutIdMap, ...keys: string[]) {
  if (keys.length === 0) {
    keys = Object.keys(timeoutIdMap.current);
  }

  keys.forEach((key) => {
    clearTimeout(timeoutIdMap.current[key]);
    timeoutIdMap.current[key] = undefined;
  });
}
