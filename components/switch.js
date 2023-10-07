"use client";

import {useState} from "react";

export default function Switch({text, onCheck}) {
  const [checked, setChecked] = useState(true);

  return (
    <label className="switch-label cursor-pointer">
      <input type="checkbox" className="toggle toggle-sm" checked={checked} onChange={() => {
        setChecked(!checked);
        onCheck(!checked);
      }}/>
      <span className="pl-1 label-text">{`${checked ? "已启用" : "已关闭"}${text}`}</span>
    </label>
  );
}
