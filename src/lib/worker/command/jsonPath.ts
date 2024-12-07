import { rootMarker } from "@/lib/idgen";
import { getViewState } from "@/lib/worker/stores/viewStore";
import { JSONPath } from "jsonpath-plus";

export interface Result {
  output?: string;
  error?: unknown;
}

export function jsonPath(path: string): Result {
  const tree = getViewState().tree;
  const json = tree.toJSON();

  try {
    const pointers: string[] =
      JSONPath({
        path,
        json,
        resultType: "pointer",
        wrap: true,
      }) ?? [];

    const values = pointers.map((p) => {
      const id = rootMarker + p;
      return tree.stringifyNode(tree.node(id));
    });

    // flatten result to a single value
    const output = values.length <= 1 ? values[0] : `[${values.join(",")}]`;

    return { output, error: undefined };
  } catch (e) {
    return { output: undefined, error: e };
  }
}
