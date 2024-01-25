import Link from "next/link";
import Feedback from "./feedback";

export default function Footer() {
  return (
    <div className="my-2 left-1/2 text-center text-[12px]">
      <a href="/">JSON For You · </a>
      <a href="https://beian.miit.gov.cn" target="_blank" rel="nofollow">
        粤ICP备16007488号 ·{" "}
      </a>
      <Link prefetch={false} href="/guide">
        使用指南 ·{" "}
      </Link>
      <Feedback/>
    </div>
  );
}
