"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import Github from "./icons/Github";
import Logo from "./icons/Logo";
import Twitter from "./icons/Twitter";

export function Footer() {
  const t = useTranslations("Home");
  const items = [
    // { href: "/terms", title: t("Terms") },
    // { href: "/privacy", title: t("Privacy") },
    { href: "https://www.trustpilot.com/evaluate/json4u.com", title: t("Give a rating") },
    { href: "https://github.com/loggerhead/json4u/issues/new", title: t("Feedback") },
    { href: "https://x.com/1oggerhead", title: <Twitter className="w-[16px] h-[16px]" /> },
    { href: "https://github.com/loggerhead/json4u", title: <Github className="w-[16px] h-[16px]" /> },
  ];

  return (
    <footer className="flex h-12 items-center justify-center w-full border-t">
      <div className="flex items-center w-full max-w-page-header md:px-8 px-4 gap-x-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Logo className="w-[20px] h-[20px] text-slate-500" />
          <span>{"© 2024 JSON For You"}</span>
        </div>
        <div className="ml-auto" />
        {items.map((item, i) => (
          <Link
            prefetch={false}
            key={i}
            href={item.href}
            target={item.href.startsWith("/") ? "" : "_blank"}
            className="pointer block w-fit hover:text-slate-900"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </footer>
  );
}
