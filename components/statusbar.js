"use client";
import { useRef, useMemo } from "react";
import MyAlert from "./alert";

export default function StatusBar({ texts }) {
  const cacheMap = useRef({});
  const textsMap = useMemo(() => {
    let obj = Object.assign(cacheMap.current, texts);

    obj = Object.entries(obj).reduce((obj, [key, value]) => {
      if (typeof value === "string") {
        if (value) {
          obj[key] = value;
        } else {
          delete obj[key];
        }
      }
      return obj;
    }, {});

    if (obj[0] === undefined) {
      obj[0] = "";
    }

    cacheMap.current = obj;
    return obj;
  }, [cacheMap, texts]);

  const keys = Object.keys(textsMap).sort();

  return (
    <div className="flex h-[22px] text-[12px] border-[0.5px] border-t-0 border-solid border-color statusbar">
      {keys.map((key, i) => {
        let classes = ["px-2.5 py-0.5"];
        classes.push(i == 0 ? "grow" : "");
        classes.push(0 < i && i < keys.length - 1 ? "statusbar-sep" : "");
        classes = classes.filter((c) => c);

        return (
          <div key={key} className={classes.join(" ")}>
            <MyAlert msg={textsMap[key]}></MyAlert>
          </div>
        );
      })}
    </div>
  );
}
