import {checkScript, executeScript} from "@elastic/micro-jq";

export function jq(text, script) {
  try {
    const obj = JSON.parse(text);
    const newObj = executeScript(obj, script);
    const edited = JSON.stringify(newObj, null, 4);
    return [edited, ""];
  } catch (e) {
    return [null, `invalid jq command: ${script}`];
  }
}

export function check(script) {
  return checkScript(script);
}
