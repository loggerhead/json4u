import { parseJSON, type ParseOptions } from "@/lib/parser";
import * as jsonc from "jsonc-parser";
import { textFormat } from "./text";

const fallbackThreshold = 100000;

/**
 * Formats a JSON string with proper indentation and spacing.
 * @param text - The JSON string to format.
 * @param options - The parsing options.
 * @returns The formatted JSON string.
 */
export function prettyFormat(text: string, options?: ParseOptions): string {
  if (text.length > fallbackThreshold) {
    return textFormat(text, options);
  }

  const pairs = findBracketPairs(text);
  const edits = [];

  for (const [start, end] of pairs) {
    const subtext = text.substring(start, end);
    const formatted = prettyFormatWithFallback(subtext, options);

    edits.push({
      offset: start,
      length: end - start,
      content: formatted,
    });
  }

  if (edits.length > 0) {
    text = jsonc.applyEdits(text, edits).trim();
  }

  return text;
}

function prettyFormatWithFallback(json: string, options?: ParseOptions): string {
  const tree = parseJSON(json);
  return tree.valid() ? tree.stringify({ format: true }) : textFormat(json, options);
}

/**
 * Finds all top-level, valid JSON objects or arrays within a string.
 * @param text - The string to search.
 * @returns An array of pairs of [start, end] indexes for each valid JSON found.
 *          The 'end' index is exclusive, suitable for `substring`.
 */
export function findBracketPairs(text: string): [number, number][] {
  const pairs: [number, number][] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (char === "{" || char === "[") {
      const start = i;
      const end = findMatchingBracket(text, start);

      if (end !== -1) {
        const potentialJson = text.substring(start, end + 1);
        try {
          JSON.parse(potentialJson);
          // It's a valid JSON, so we add it to our pairs.
          // The end index for substring should be `end + 1`.
          pairs.push([start, end + 1]);
          // Jump past this entire valid JSON block.
          i = end + 1;
          continue;
        } catch (e) {
          // It's not a valid JSON, so we just move on.
        }
      }
    }
    // Move to the next character if no JSON was found starting at `i`.
    i++;
  }

  return pairs;
}

/**
 * Finds the matching closing bracket for a given opening bracket.
 * @param text - The string to search within.
 * @param startIndex - The index of the opening bracket.
 * @returns The index of the matching closing bracket, or -1 if not found.
 */
function findMatchingBracket(text: string, startIndex: number): number {
  const openChar = text[startIndex];
  const closeChar = openChar === "{" ? "}" : "]";
  let count = 1;
  let inString = false;
  let isEscaped = false;

  for (let i = startIndex + 1; i < text.length; i++) {
    const c = text[i];

    if (c === '"' && !isEscaped) {
      inString = !inString;
    } else {
      isEscaped = c === "\\" && !isEscaped;
    }

    if (inString) {
      continue;
    }

    if (c === openChar) {
      count++;
    } else if (c === closeChar) {
      count--;
    }

    if (count === 0) {
      return i;
    }
  }

  return -1; // Not found
}
