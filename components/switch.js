"use client";
import {Switch, Tooltip} from "@arco-design/web-react";
import {switchAutoFormat, switchAutoSort, switchNestParse} from "@/reducers";
import {useDispatch, useSelector} from "react-redux";
import {enableAutoFormatSelector, enableAutoSortSelector, enableNestParseSelector} from "@/lib/store";

export function FormatSwitch() {
  const enableAutoFormat = useSelector(enableAutoFormatSelector);
  const dispatch = useDispatch();

  const name = "自动格式化";
  const desc = "粘贴或拖拽上传文件时，执行格式化";

  return (
    <Tooltip mini position="bottom" content={desc}>
      <Switch checked={enableAutoFormat}
              defaultChecked={enableAutoFormat}
              checkedText={name}
              uncheckedText={name}
              onChange={() => dispatch(switchAutoFormat())}/>
    </Tooltip>
  );
}

export function SortSwitch() {
  const enableAutoSort = useSelector(enableAutoSortSelector);
  const dispatch = useDispatch();

  const name = "自动排序";
  const desc = <span>粘贴或拖拽上传文件时，执行 JSON 升序排序。<br/>比较时，进行文本比较。</span>;

  return (
    <Tooltip mini position="bottom" content={desc}>
      <Switch checked={enableAutoSort}
              defaultChecked={enableAutoSort}
              checkedText={name}
              uncheckedText={name}
              onChange={() => dispatch(switchAutoSort())}/>
    </Tooltip>
  );
}

export function NestParseSwitch() {
  const enableNestParse = useSelector(enableNestParseSelector);
  const dispatch = useDispatch();

  const name = "嵌套解析";
  const desc = "递归的将被转义的字符串进行 JSON 解析";

  return (
    <Tooltip mini position="bottom" content={desc}>
      <Switch checked={enableNestParse}
              defaultChecked={enableNestParse}
              checkedText={name}
              uncheckedText={name}
              onChange={() => dispatch(switchNestParse())}/>
    </Tooltip>
  );
}
