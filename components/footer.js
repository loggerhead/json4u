import Link from "next/link";

export default function Footer() {
  return (
    <div className="fixed bottom-0 my-2 left-1/2 -translate-x-1/2 text-center text-[12px]">
      <a href="/">Json For You · </a>
      <a href="https://beian.miit.gov.cn" target="_blank" rel="nofollow">
        粤ICP备16007488号 ·{" "}
      </a>
      <Link prefetch={false} href="/guide">
        使用指南 ·{" "}
      </Link>
      <a href="https://github.com/loggerhead/json4u-issue/issues">Feedback</a>
    </div>
  );
}
