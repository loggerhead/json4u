"use client";
import {Empty} from "@arco-design/web-react";

export default function NotFound() {
  return <Empty className="h-screen flex items-center justify-center text-2xl"
                description="分享数据已过期，或者数据不存在"/>;
}