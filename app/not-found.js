"use client";
import {Empty} from "@arco-design/web-react";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      window.location.href = process.env.NEXT_PUBLIC_HOST;
    }, countdown * 1000);
  }, []);

  return <Empty className="h-screen flex items-center justify-center text-2xl"
                description={<a href="/">分享已过期，或者数据不存在（{`${countdown}秒后返回主页`}）</a>}/>;
}
