export function urlToJsonString(s) {
  const m = urlToMap(s);
  return mapStringify(m);
}

function urlToMap(s) {
  const u = new URL(s);
  const m = new Map();
  const q = new Map();

  m.set("Scheme", u.protocol);
  if (u.username) {
    m.set("Username", u.username);
  }
  if (u.password) {
    m.set("Password", u.password);
  }
  if (u.hostname) {
    m.set("Host", u.hostname);
  }
  if (u.port) {
    m.set("Port", u.port);
  }
  if (u.pathname && u.pathname !== "/") {
    m.set("Path", u.pathname);
  }
  if (u.hash) {
    m.set("Hash", u.hash);
  }

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

function mapStringify(m) {
  const doStringify = (m) => {
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
