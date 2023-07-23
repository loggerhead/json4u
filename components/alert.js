"use client";

// ! 开头的 message 表示错误
export default function MyAlert({ message }) {
  const isError = message?.startsWith("!");
  var className = "alert-info";

  if (isError) {
    className = "alert-error";
    message = message?.slice(1);
  }

  className += " " + (message?.length > 0 ? "" : "hidden");
  return <div className={className}>{message}</div>;
}
