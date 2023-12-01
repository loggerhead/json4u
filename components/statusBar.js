"use client";
import {Button, Input, Tooltip} from "@arco-design/web-react";
import MsgBar from "./msgBar";
import {useDispatch, useSelector} from "react-redux";
import {getLastEditor, getPairEditor, setLastCmd, switchEnableCmdMode} from "@/features/ctxSlice";
import {useEffect, useState} from "react";
import * as jq from "@/lib/jq";

const height = "22px";

export default function StatusBar({texts}) {
  const ctx = useSelector((state) => state.ctx);
  const dispatch = useDispatch();
  const [parseFailed, setParseFailed] = useState(false);
  const [input, setInput] = useState('');
  const [popVisible, setPopVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const text = getLastEditor(ctx)?.text();
      if (!text) {
        return;
      }

      const [edited, errmsg] = jq.jq(text, input);

      if (errmsg) {
        console.log(errmsg);
      } else {
        const editor = getPairEditor(ctx);
        editor.setText(edited);
        editor.revealLine(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input]);

  const onInputCmd = (text) => {
    text = text.trim();
    dispatch(setLastCmd(text));

    if (text === "") {
      setParseFailed(false);
      return;
    } else if (!jq.check(text)) {
      setParseFailed(true);
      return;
    }

    setParseFailed(false);
    setInput(text);
  };

  return (
    <div
      className={`flex items-center min-h-[${height}] text-[12px] border-[0.5px] border-t-0 border-solid border-color statusbar`}>
      <Tooltip mini popupVisible={ctx.enableCmdMode ? false : popVisible}
               onVisibleChange={(visible) => setPopVisible(visible)}
               content="点击按钮切换到命令模式，使用 jq 处理 JSON">
        <Button style={{width: height, height: height, border: 0, borderRadius: 0}}
                type="primary"
                icon=">"
                status={ctx.enableCmdMode ? "success" : "default"}
                onClick={() => dispatch(switchEnableCmdMode())}/>
      </Tooltip>
      {
        ctx.enableCmdMode ?
          <Input allowClear
                 placeholder="输入 jq 命令"
                 size="mini"
                 style={{border: 0}}
                 className={`px-2.5 ${parseFailed ? "statusbar-error" : ""}`}
                 defaultValue={ctx.lastCmd}
                 onChange={onInputCmd}
                 onPressEnter={(e) => onInputCmd(e.target.value)}/> :
          <MsgBar texts={ctx.statusBar}></MsgBar>
      }
    </div>
  );
}
