import React, { useCallback } from "react";
import { config } from "@/lib/graph/layout";
import { downloadFile } from "@/lib/utils";
import { useReactFlow, getNodesBounds, getViewportForBounds, ControlButton } from "@xyflow/react";
import { toPng } from "html-to-image";
import { ArrowDownToLine } from "lucide-react";

// TODO: fix big image display problem
// stolen from https://reactflow.dev/examples/misc/download-image
export default function DownloadButton() {
  const { getNodes } = useReactFlow();
  const onClick = useCallback(() => {
    const bounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(bounds, config.imageWidth, config.imageHeight, config.minZoom, 1, 0);

    toPng(document.querySelector(".react-flow__viewport") as HTMLElement, {
      backgroundColor: "transparent",
      width: config.imageWidth,
      height: config.imageHeight,
      style: {
        width: config.imageWidth,
        height: config.imageHeight,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => downloadFile("png", dataUrl));
  }, []);

  return (
    <ControlButton onClick={onClick}>
      <ArrowDownToLine />
    </ControlButton>
  );
}
