import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.d.ts";

export type { editor as editorApi, languages } from "monaco-editor/esm/vs/editor/editor.api.d.ts";
export type * from "monaco-editor/esm/vs/editor/editor.api.d.ts";

// For avoid load monaco in store, we need to export monaco api
export interface MonacoApi {
  Raw: typeof monaco;
  KeyCode: typeof monaco.KeyCode;
  MinimapPosition: typeof monaco.MinimapPosition;
  OverviewRulerLane: typeof monaco.OverviewRulerLane;
  Range: typeof monaco.Range;
  RangeFromPositions: typeof monaco.Range.fromPositions;

  // used for e2e tests.
  main?: editorApi.IStandaloneCodeEditor;
  secondary?: editorApi.IStandaloneCodeEditor;
}
