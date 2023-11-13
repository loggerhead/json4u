"use client";

import {useState} from "react";
import {Switch as ArcoSwitch} from "@arco-design/web-react";


export default function Switch({text, onCheck}) {
  const [checked, setChecked] = useState(true);

  return (
    <ArcoSwitch defaultChecked checkedText={text} uncheckedText={text} onChange={(value, event) => {
      setChecked(value);
      onCheck(value);
    }}/>
  );
}
