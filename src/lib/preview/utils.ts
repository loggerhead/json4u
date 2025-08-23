import { h } from "@/lib/table/tag";

export function genTableForMap(m: Map<string, string | Map<string, any>>): string {
  return genTable(
    Object.fromEntries(Array.from(m).map(([k, v]) => [k, typeof v === "string" ? v : genTableForMap(v)])),
  );
}

export function genTable(
  data: Record<string, string>,
  styleFn?: (k: string, v: string) => { keyStyle?: string; valueStyle?: string },
): string {
  return h(
    "table",
    ...Object.entries(data).map(([key, value]) => {
      const { keyStyle, valueStyle } = styleFn ? styleFn(key, value) : { keyStyle: "", valueStyle: "" };
      return h(
        "tr",
        h("td", h("span", h("b", key)).style(keyStyle)),
        h("td", h("span", "　")),
        h("td", h("span", value).style(valueStyle)),
      );
    }),
  ).toString();
}
