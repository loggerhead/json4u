"use client";

// 需要将枚举值定义出来，否则编译器不知道使用了哪些 class，就不会编译，导致样式不生效
const _ = ["alert-blue", "alert-green", "alert-yellow", "alert-red"];

export default function MyAlert({ props }) {
  const { msg, color } = props;
  const className = msg?.length > 0 ? `alert-${color}` : "hidden";
  return <div className={className}>{msg}</div>;
}
