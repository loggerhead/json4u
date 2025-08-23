import { base64Previewer } from "./base64";
import { colorPreviewer } from "./color";
import { datePreviewer } from "./date";
import { imagePreviewer } from "./image";
import { jwtPreviewer } from "./jwt";
import type { Previewer } from "./types";
import { unicodePreviewer } from "./unicode";
import { uriPreviewer } from "./uri";
import { urlPreviewer } from "./url";

// Note: The order here is important as it determines the detection priority
const previewers: Previewer[] = [
  imagePreviewer,
  urlPreviewer,
  datePreviewer,
  colorPreviewer,
  base64Previewer,
  uriPreviewer,
  jwtPreviewer,
  unicodePreviewer,
];

// This function will replace the old guessPreviewType and genPreviewHTML
export async function generatePreview(value: string, rawValue: string) {
  for (const p of previewers) {
    if (await p.detector(value, rawValue)) {
      return p.generator(value, rawValue);
    }
  }
  return null;
}
