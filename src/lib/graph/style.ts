import type { CSSProperties } from "react";

const highlightColor = "rgb(4, 81, 165)";
const selectedColor = "rgb(163, 21, 21)";

// Style applied to a graph node when it is explicitly selected by the user, usually via a direct click.
const nodeSelectedStyle: CSSProperties = { borderColor: selectedColor, borderWidth: 1 };
// Style applied to a graph node when it is highlighted, for instance, when search result is found or parent node is selected.
const nodeHighlightStyle: CSSProperties = { borderColor: highlightColor, borderWidth: 1 };
const edgeHighlightStyle: CSSProperties = { stroke: highlightColor, strokeWidth: 1.5 };

export { nodeSelectedStyle, nodeHighlightStyle, edgeHighlightStyle };
