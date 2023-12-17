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
    const editor = getLastEditor(ctx);
    const text = editor?.text();

    const print = (msg, isError = false) => {
      if (alert) {
        show(msg, isError);
      } else {
        console.log(msg);
      }
    };

    if (!editor) {
      return;
    } else if (!text) {
      print(`${editor.isLeft() ? "左侧" : "右侧"}输入为空`);
      return;
    }

    const [edited, err] = await jq.jq(text, filter);
    setParseFailed(Boolean(err));

    if (err) {
      const msg = `执行 jq 失败: ${err}`;
      print(msg, true);
    } else if (edited && edited.trim()) {
      const editor = getPairEditor(ctx);
      editor.setText(edited);
      editor.revealLine(1);
    } else {
      print("执行 jq 成功，但输出为空");
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
        <Button id="cmd-mode-btn"
                style={{width: height, height: height, border: 0, borderRadius: 0}}
                type="primary"
                icon=">"
                loading={loading}
                status={ctx.enableCmdMode ? "success" : "default"}
                onClick={() => {
                  dispatch(switchEnableCmdMode());

                  if (!ctx.enableCmdMode) {
                    const timer = setTimeout(() => setLoading(true), 50);

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
          <Input id="cmd-mode-input"
                 allowClear
                 placeholder={`输入 jq 表达式处理${getLastEditor(ctx).isLeft() ? "左侧" : "右侧"}文本 (支持 jq ${jq.version})`}
                 size="mini"
                 style={{border: 0}}
                 className={`px-2.5 ${parseFailed ? "statusbar-error" : ""}`}
                 defaultValue={ctx.lastCmd}
                 onChange={onInputCmd}
                 onPressEnter={async (e) => {
                   const filter = e.target.value;
                   await execJq(filter, true);
                 }}/> :
          <MsgBar texts={ctx.statusBar}></MsgBar>
      }
    </div>
  );
}

function show(msg, isError = false) {
  let lines = msg.split("\n");

  // 截断，仅保留前 10 行
  if (lines.length > 10) {
    lines = lines.slice(0, 10);
    lines.push("...");
  }

  msg = lines.join("\n");

  (isError ? Message.error : Message.info)({
    content: msg,
    style: {
      whiteSpace: "pre-line",
      textAlign: "left",
    },
    closable: true,
  });
}