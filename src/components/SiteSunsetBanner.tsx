import { isCN } from "@/lib/env";
import Link from "next/link";

export default function SiteSunsetBanner() {
  if (!isCN) {
    return null;
  }

  return (
    <div className="w-full border-b border-amber-300 bg-amber-50 text-amber-950">
      <div className="mx-auto flex min-h-11 w-full max-w-[1280px] items-center justify-center px-4 py-2 text-center text-sm font-medium md:px-8">
        <span>
          {"json4u.cn 将于 2026-07-31 下线，请改用 "}
          <Link href="https://treease.com" className="underline underline-offset-2 hover:text-amber-700">
            {"treease.com"}
          </Link>
        </span>
      </div>
    </div>
  );
}
