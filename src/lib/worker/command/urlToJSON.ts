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

function urlToMap(s: string) {
  const isIntact = /^\w+:\/\/.*/g.test(s);
  const u = new URL(isIntact ? s : `http://json4u.com${s.startsWith("/") ? s : "/" + s}`);
  const m = new Map();
  const q = new Map();

  if (isIntact) {
    m.set("Scheme", u.protocol);
    u.hostname && m.set("Host", u.hostname);
  }

  u.username && m.set("Username", u.username);
  u.password && m.set("Password", u.password);
  u.port && m.set("Port", u.port);
  u.pathname && m.set("Path", u.pathname);
  u.hash && m.set("Hash", u.hash);

  u.searchParams.forEach((value, name) => {
    if (typeof value === "string" && value.match(/[a-zA-Z]:\/\//)) {
      try {
        const v = urlToMap(value);
        q.set(name, v);
      } catch (e) {
        q.set(name, value);
      }
    } else {
      q.set(name, value);
    }
  });

  if (q.size > 0) {
    m.set("Query", q);
  }

  return m;
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
