import { type DependencyList, useMemo } from "react";
import { debounce } from "lodash-es";

export function useDebounceFn<T extends (...args: any) => any>(
  fn: T,
  wait: number,
  deps: DependencyList,
  isLeading: boolean = true,
) {
  return useMemo(() => debounce(fn, wait, isLeading ? { leading: true } : { trailing: true }), deps);
}
