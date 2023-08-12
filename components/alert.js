"use client";
import { useRef, useMemo } from "react";

// 需要将枚举值定义出来，否则编译器不知道使用了哪些 class，就不会编译，导致样式不生效
const _ = ["alert-blue", "alert-green", "alert-yellow", "alert-red"];
// 组件两次间隔不到 100ms 时，不更新组件
const minUpdateInterval = 100;

export default function MyAlert({ richText }) {
  const prevAlert = useRef({ msg: "", time: 0 });

  const alert = useMemo(() => {
    const now = Date.now();
    const { time } = prevAlert.current;

    if (now - time > minUpdateInterval) {
      prevAlert.current = { msg: richText, time: now };
    }

    return prevAlert.current;
  }, [richText, prevAlert]);

  const { msg } = alert;
  const parts = msg
    .split(/<\/\w+>/)
    .filter((s) => s.length)
    .map((s) => {
      const m = [...s.matchAll(/<(\w+)>(.*)/g)][0];
      return m ? [m[1], m[2]] : ["", s];
    });

  return (
    <div className={`text-sm rounded ${msg?.length ? "" : "hidden"}`}>
      {parts.map((part, i) => {
        const [color, msg] = part;
        const pl = i === 0 ? "pl-2 " : "";
        const pr = i === parts.length - 1 ? "pr-2" : "";

        return (
          <span key={i} className={`py-[3px] ${pl} ${pr} alert-${color}`}>
            {msg}
          </span>
        );
      })}
    </div>
  );
}
