"use client";
import {Popover, Switch} from "@arco-design/web-react";
import {switchAutoFormat, switchAutoSort} from "@/features/ctxSlice";
import {useDispatch, useSelector} from "react-redux";

export function FormatSwitch() {
  const ctx = useSelector((state) => state.ctx);
  const dispatch = useDispatch();

  const name = "自动格式化";
  const desc = "粘贴时，执行格式化";

  return (
    <Popover position="bottom" content={desc}>
      <Switch checked={ctx.enableAutoFormat}
              defaultChecked={ctx.enableAutoFormat}
              checkedText={name}
              uncheckedText={name}
              onChange={() => dispatch(switchAutoFormat())}/>
    </Popover>
  );
}

export function SortSwitch() {
  const ctx = useSelector((state) => state.ctx);
  const dispatch = useDispatch();

  const name = "自动排序";
  const desc = <span>粘贴时，执行 JSON 升序排序。<br/>比较时，进行文本比较。</span>;

  return (
    <Popover position="bottom" content={desc}>
      <Switch checked={ctx.enableAutoSort}
              defaultChecked={ctx.enableAutoSort}
              checkedText={name}
              uncheckedText={name}
              onChange={() => dispatch(switchAutoSort())}/>
    </Popover>
  );
}
