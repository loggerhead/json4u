import { join } from "./pointer";

export * from "./pointer";

const tablePrefix = "tbl";
const expanderPrefix = "exp";

function genId(pointer: string, prefix: string) {
  return prefix + pointer;
}

function peelId(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.substring(prefix.length) : id;
}

export function isPeeled(id1: string, id2: string) {
  return id1.length != id2.length;
}

export function genTableId(pointer: string, ...keys: string[]) {
  return genId(join(pointer, ...keys), tablePrefix);
}

export function peelTableId(tableId: string) {
  return peelId(tableId, tablePrefix);
}

export function genExpanderId(nodeIdOrDomId: string, ...keys: string[]) {
  return genId(join(peelId(nodeIdOrDomId, tablePrefix), ...keys), expanderPrefix);
}

export function peelExpanderId(expanderId: string) {
  return peelId(expanderId, expanderPrefix);
}
