import * as compare from "@/lib/compare";
import { Tree, TreeObject } from "@/lib/parser";

export { compareText } from "@/lib/compare";

export function compareTree(ltreeObject: TreeObject, rtreeObject: TreeObject) {
  const ltree = Tree.fromObject(ltreeObject);
  const rtree = Tree.fromObject(rtreeObject);
  return compare.compareJSON(ltree, rtree);
}
