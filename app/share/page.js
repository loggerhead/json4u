"use client";
import {useSelector} from "react-redux";
import {leftEditorSelector, rightEditorSelector} from "@/lib/store";
import Home from "@/app/page";
import {useEffect, useState} from "react";
import {notFound, useSearchParams} from "next/navigation";

export default function SharePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const leftEditor = useSelector(leftEditorSelector);
  const rightEditor = useSelector(rightEditorSelector);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const editorInitialized = Boolean(leftEditor && rightEditor);
  const initSucc = Boolean(editorInitialized && data);

  useEffect(() => {
    fetch(`https://api.json4u.com/api/share?id=${id}`)
      .then((resp) => resp.json())
      .then((data) => {
        const e = data?.error;
        if (e) {
          console.error(`加载分享内容失败：${e}`);
        } else {
          setData(data);
        }
      })
      .catch((e) => console.error(`加载分享内容失败：${e}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initSucc) {
      const {left, right, lastAction} = data;
      leftEditor.setText(left);
      rightEditor.setText(right);

      if (lastAction?.action === 'Compare') {
        rightEditor.compare(lastAction.options);
      }
    }
  }, [initSucc]);

  // 如果数据加载完成、编辑器初始化完成，但是初始化失败，说明没查到数据
  if (!loading && editorInitialized && !initSucc) {
    notFound();
  }

  return <Home loading={!data}/>;
}
