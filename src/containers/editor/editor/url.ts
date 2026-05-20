export const initialJSONParamName = "json";

export function getInitialJSONFromSearch(search: string) {
  const searchParams = new URLSearchParams(search);
  return searchParams.has(initialJSONParamName) ? searchParams.get(initialJSONParamName)! : undefined;
}
