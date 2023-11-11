"use client";

import {useState} from "react";
import {Switch as ArcoSwitch} from "@arco-design/web-react";


export default function Switch({text, onCheck}) {
  const [checked, setChecked] = useState(true);

  return (
    <ArcoSwitch checkedText={text} uncheckedText={text} onClick={() => {
      setChecked(!checked);
      onCheck(!checked);
    }}/>
  );
}
