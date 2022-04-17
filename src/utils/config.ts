export class Config {
  syncScroll: boolean = true;
}

var globalConf: Config;

export function getConfig(): Config {
  if (!globalConf) {
    const configStr = localStorage.getItem("config");
    let conf: Config;

    if (configStr) {
      conf = JSON.parse(configStr);
    } else {
      conf = new Config();
    }

    globalConf = new Proxy(conf, {
      set(obj, prop, value) {
        (obj as any)[prop] = value;
        console.log("save config: ", obj);
        localStorage.setItem("config", JSON.stringify(obj));
        return true;
      },
    });
  }

  return globalConf;
}
