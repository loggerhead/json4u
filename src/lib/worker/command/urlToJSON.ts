import { getConfig } from "@/lib/db/config";
import { parseJSON } from "@/lib/parser";

export async function urlToJSON(text: string): Promise<{ text: string; parse: boolean }> {
  if (!text.trim()) {
    return { text, parse: false };
  }

  const options = (await getConfig()).parseOptions;

  try {
    const tree = parseJSON(mapStringify(urlToMap(text)), options);
    return { text: tree.text, parse: tree.valid() };
  } catch (e) {
    return { text, parse: false };
  }
}

export function urlToMap(s: string) {
  const isFullURI = isURI(s);
  const u = new URL(isFullURI ? s : `http://json4u.com/${s.replace(/^\//, "")}`);
  const m = new Map();

  if (isFullURI) {
    u.protocol && m.set("Protocol", u.protocol.replace(/:$/, ""));
    u.hostname && m.set("Host", u.hostname);
  }

  u.username && m.set("Username", u.username);
  u.password && m.set("Password", u.password);
  u.port && m.set("Port", u.port);
  u.pathname && m.set("Path", u.pathname);
  u.hash && m.set("Hash", u.hash);

  const dups = new Map();

  u.searchParams.forEach((_, name) => {
    dups.set(name, (dups.get(name) ?? 0) + 1);
  });

  const q = new Map();

  u.searchParams.forEach((value, name) => {
    const v = isURI(value) ? urlToMap(value) : value;

    if (dups.get(name) > 1) {
      const vv = q.get(name) ?? [];
      vv.push(v);
      q.set(name, vv);
    } else {
      q.set(name, v);
    }
  });

  if (q.size > 0) {
    m.set("Query", q);
  }

  return m;
}

function isURI(s: string) {
  return typeof s === "string" && /^\w+:\/\/.*/g.test(s);
}

function mapStringify(m: Map<string, any>) {
  const doStringify = (m: Map<string, any>): string => {
    if (m instanceof Map) {
      const ss = [];

      for (const [k, v] of m) {
        ss.push(`"${k}":${doStringify(v)}`);
      }

      return `{${ss.join(",")}}`;
    } else if (typeof m === "number") {
      return `${m}`;
    } else {
      return JSON.stringify(m);
    }
  };

  return doStringify(m);
}
