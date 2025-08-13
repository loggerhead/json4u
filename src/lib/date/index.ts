export const dateRe = /20\d{2}-[01]\d-[0-3]\d/;
export const timeRe = /[0-2]\d:[0-5]\d:[0-5]\d/;
export const timeZoneRe = /([+-])([0-2]\d):([0-5]\d)/;

export function genDate(value: string): Date {
  if (isTimestamp(value)) {
    const numValue = Number(value);
    return new Date(numValue * (value.length === 10 ? 1000 : 1));
  }

  const date = new Date();
  const localOffsetMS = date.getTimezoneOffset() * 60 * 1000;

  if (concatRe("^", dateRe, "T", timeRe, "Z").test(value)) {
    const v = new Date(value.replace(/Z$/, ""));
    return new Date(v.getTime() + localOffsetMS);
  } else if (concatRe("^", dateRe, "T", timeRe, timeZoneRe, "$").test(value)) {
    const timePart = value.replace(concatRe(timeZoneRe, "$"), "");
    const utc = new Date(timePart + "Z");
    const match = value.match(timeZoneRe);

    if (match) {
      const sign = match[1];
      const hours = Number(match[2]);
      const minutes = Number(match[3]);
      const offset = (hours * 60 + minutes) * 60 * 1000 * (sign === "+" ? -1 : 1);
      return new Date(utc.getTime() + offset);
    } else {
      return utc;
    }
  } else {
    return new Date(value);
  }
}

export function isDate(value: string) {
  return concatRe("^", dateRe).test(value);
}

export function isTimestamp(value: string) {
  return /^1(\d{9}|\d{12})$/.test(value);
}

export function concatRe(re1: RegExp | string, ...re2: (RegExp | string)[]) {
  const first = typeof re1 === "string" ? re1 : re1.source;
  return new RegExp([first, ...re2.map((r) => (typeof r === "string" ? r : r.source))].join(""));
}
