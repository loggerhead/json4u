import type { CSSProperties } from "react";
import type { GraphNodeStyle } from "./types";

const highlightColor = "rgb(4, 81, 165)";
const selectedColor = "rgb(163, 21, 21)";

// Style applied to a graph node when it is explicitly selected by the user, usually via a direct click.
const nodeSelectedStyle: CSSProperties = { borderColor: selectedColor, borderWidth: 1 };
// Style applied to a graph node when it is highlighted, for instance, when search result is found or parent node is selected.
const nodeHighlightStyle: CSSProperties = { borderColor: highlightColor, borderWidth: 1 };
const edgeHighlightStyle: CSSProperties = { stroke: highlightColor, strokeWidth: 1.5 };

// measured in MainPanel when mounted. The value should remain consistent between the main thread and the web worker.
const globalStyle: GraphNodeStyle = {
  fontWidth: 7.2,
  padding: 20,
  borderWidth: 1,
  kvGap: 20,
  kvHeight: 18,
  maxKeyWidth: 300,
  maxValueWidth: 500,
  nodeGap: 25,
  levelGap: 75,
};

const initialViewport = { x: globalStyle.nodeGap, y: globalStyle.nodeGap, zoom: 1 };

function setupGlobalGraphStyle(style: Partial<GraphNodeStyle>) {
  Object.assign(globalStyle, style);
}

export {
  nodeSelectedStyle,
  nodeHighlightStyle,
  edgeHighlightStyle,
  globalStyle,
  setupGlobalGraphStyle,
  initialViewport,
};
