// @ts-ignore
import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { isDev } from "./env";

export function tryCatch<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function dateToYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function clone(o: any) {
  if (typeof structuredClone !== "undefined") {
    return structuredClone(o);
  } else {
    return JSON.parse(JSON.stringify(o));
  }
}

// stolen from https://github.com/piotrwitek/utility-types/blob/master/src/mapped-types.ts#L77
export type FunctionKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends Function ? K : never;
}[keyof T];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isApproximatelyEqual(a: number, b: number, tolerance: number) {
  return Math.abs(a - b) < tolerance;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

// 200px => 200
export function px2num(px: string) {
  return Number(px.slice(0, -2));
}

const toastOptions = {
  duration: 2000,
};

export function toastSucc(msg: string, id?: string) {
  toast.success(msg, { ...toastOptions, id });
}

export function toastWarn(msg: string, id?: string) {
  toast.warning(msg, { ...toastOptions, id });
}

export function toastErr(msg: string, id?: string) {
  toast.error(msg, { ...toastOptions, id });
}

export function detectOS() {
  if (typeof window === "undefined") {
    return "Unknown OS";
  }

  // if a browser has no support for navigator.userAgentData.platform use platform as fallback
  // @ts-ignore
  const userAgent = (navigator.userAgentData?.platform ?? (navigator.platform || navigator.userAgent)).toLowerCase();

  if (userAgent.includes("win")) {
    return "Windows";
  } else if (userAgent.includes("android")) {
    return "Android";
  } else if (userAgent.includes("mac")) {
    return "Mac";
  } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return "iOS";
  } else if (userAgent.includes("linux")) {
    return "Linux";
  }

  return "Unknown OS";
}

export function downloadFile(suffix: string, dataUrl: string) {
  const a = document.createElement("a");
  a.setAttribute("download", genDownloadFileName(suffix));
  a.setAttribute("href", dataUrl);
  a.click();
  return a;
}

function genDownloadFileName(suffix: string) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `json4u-${hours}${minutes}${seconds}.${suffix.toLowerCase()}`;
}

const pathRegex = /(?:(?:file|https?|global code|[^@]+)@)?(?:file:)?((?:\/[^:/]+){2,})(?::(\d+))?(?::(\d+))?/;

export function initLogger() {
  const t = () => {
    const s = new Date().toISOString().split("T")[1].replace("Z", "");
    return `[${s}]`;
  };

  const log = (rawLog: (...args: any[]) => void, ...args: any[]) => {
    try {
      const fixWidth = 20;
      const stack = Error().stack!.split("\n");
      const match = stack[3].match(pathRegex)!;
      const fileName = match[1].replace(/\?.*$/, "").split("/").pop() ?? "";
      const spaces = fileName.length < fixWidth ? " ".repeat(fixWidth - fileName.length) : "";
      rawLog(t(), `[${fileName}]${spaces}\t`, ...args);
    } catch (e) {
      rawLog(t(), ...args);
    }
  };

  // @ts-ignore
  console.rawInfo = console.info.bind(console);
  // @ts-ignore
  console.l = function (...args: any[]) {
    // @ts-ignore
    log(this.rawInfo, ...args);
  };
}
