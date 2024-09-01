import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.d.ts";

export type { editor as editorApi } from "monaco-editor/esm/vs/editor/editor.api.d.ts";
export type * from "monaco-editor/esm/vs/editor/editor.api.d.ts";

// For avoid load monaco in store, we need to export monaco api
export interface MonacoApi {
  KeyCode: typeof monaco.KeyCode;
  MinimapPosition: typeof monaco.MinimapPosition;
  OverviewRulerLane: typeof monaco.OverviewRulerLane;
  Range: typeof monaco.Range;
  RangeFromPositions: typeof monaco.Range.fromPositions;
}
