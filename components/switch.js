"use client";

import {Switch as ArcoSwitch} from "@arco-design/web-react";

export default function Switch({text, checked, onCheck}) {
  return (
    <ArcoSwitch checked={checked} defaultChecked={checked} checkedText={text} uncheckedText={text} onChange={onCheck}/>
  );
}
