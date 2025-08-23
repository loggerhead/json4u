// src/lib/preview/types.ts
export interface Previewer {
  // Used to detect if the string belongs to this type
  detector: (value: string, rawValue?: string) => Promise<boolean> | boolean;
  // Used to generate the preview HTML content
  generator: (value: string, rawValue?: string) => Promise<string | string[]> | string | string[];
}
