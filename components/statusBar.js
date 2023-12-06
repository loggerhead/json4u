"use client";
import {Button, Input, Message, Tooltip} from "@arco-design/web-react";
import MsgBar from "./msgBar";
import {useDispatch, useSelector} from "react-redux";
import {getLastEditor, getPairEditor, setLastCmd, switchEnableCmdMode} from "@/features/ctxSlice";
import {useEffect, useState} from "react";
import * as jq from "@/lib/jq";

const height = "22px";

export default function StatusBar({texts}) {
  const ctx = useSelector((state) => state.ctx);
  const dispatch = useDispatch();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parseFailed, setParseFailed] = useState(false);
  const [popVisible, setPopVisible] = useState(false);

  const onInputCmd = (text) => {
    text = text.trim();
    dispatch(setLastCmd(text));

    if (text === "") {
      setParseFailed(false);
      return;
    } else if (!jq.isValidFilter(text)) {
      setParseFailed(true);
      return;
    }

    setInput(text);
  };

  const execJq = async (filter, alert = false) => {
    const text = getLastEditor(ctx)?.text();
    if (!text) {
      return;
    }

    const [edited, err] = await jq.jq(text, filter);

    if (err) {
      setParseFailed(true);
      const errmsg = `执行 jq 失败: ${err}`;

      if (alert) {
        Message.error({
          content: errmsg,
          style: {
            whiteSpace: "pre-line",
            textAlign: "left",
          },
          closable: true,
        });
      } else {
        console.log(errmsg);
      }
    } else {
      setParseFailed(false);
      const editor = getPairEditor(ctx);
      editor.setText(edited);
      editor.revealLine(1);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => execJq(input), 500);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <div
      className={`flex items-center min-h-[${height}] text-[12px] border-[0.5px] border-t-0 border-solid border-color statusbar`}>
      <Tooltip mini popupVisible={ctx.enableCmdMode ? false : popVisible}
               onVisibleChange={(visible) => setPopVisible(visible)}
               content="点击按钮切换到命令模式，使用 jq 处理 JSON">
        <Button style={{width: height, height: height, border: 0, borderRadius: 0}}
                type="primary"
                icon=">"
                loading={loading}
                status={ctx.enableCmdMode ? "success" : "default"}
                onClick={() => {
                  dispatch(switchEnableCmdMode());

                  if (!ctx.enableCmdMode) {
                    const timer = setTimeout(() => setLoading(true), 500);

                    jq.init().catch(() => {
                      Message.error("加载 jq 失败");
                    }).finally(() => {
                      clearTimeout(timer);
                      setLoading(false);
                    });
                  }
                }}/>
      </Tooltip>
      {
        ctx.enableCmdMode ?
          <Input allowClear
                 placeholder={`输入 jq 命令 (支持 jq ${jq.version})`}
                 size="mini"
                 style={{border: 0}}
                 className={`px-2.5 ${parseFailed ? "statusbar-error" : ""}`}
                 defaultValue={ctx.lastCmd}
                 onChange={onInputCmd}
                 onPressEnter={(e) => {
                   const filter = e.target.value;
                   execJq(filter, true);
                 }}/> :
          <MsgBar texts={ctx.statusBar}></MsgBar>
      }
    </div>
  );
}
