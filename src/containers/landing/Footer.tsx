"use client";

import GitHub from "@/components/icons/GitHub";
import Logo from "@/components/icons/Logo";
import Twitter from "@/components/icons/Twitter";
import Weibo from "@/components/icons/Weibo";
import { isCN } from "@/lib/env";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Home");
  const items = [
    { href: "https://www.trustpilot.com/review/json4u.com", title: t("Give a rating") },
    { href: "https://github.com/loggerhead/json4u/issues/new", title: t("Feedback") },
    isCN()
      ? { href: "https://weibo.com/loggerhead", title: <Weibo className="w-5 h-5" /> }
      : { href: "https://x.com/1oggerhead", title: <Twitter className="icon" /> },
    { href: "https://github.com/loggerhead/json4u", title: <GitHub className="icon" /> },
  ];

  return (
    <footer className="flex h-12 items-center justify-center w-full border-t">
      <div className="flex items-center w-full max-w-page-header md:px-8 px-4 gap-x-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Logo className="w-[20px] h-[20px] text-slate-500" />
          <span>{"© 2024 JSON For You"}</span>
        </div>
        <Legal />
        <div className="ml-auto" />
        {items.map((item, i) => (
          <FooterLink key={i} title={item.title} href={item.href} />
        ))}
      </div>
    </footer>
  );
}

function Legal() {
  const t = useTranslations("Home");

  return (
    <div className="flex items-center gap-8">
      {isCN() ? (
        <FooterLink nofollow href="https://beian.miit.gov.cn" title={"粤ICP备16007488号"} />
      ) : (
        <>
          <FooterLink href="/terms" title={t("Terms")} />
          <FooterLink href="/privacy" title={t("Privacy")} />
        </>
      )}
    </div>
  );
}

function FooterLink({ href, title, nofollow }: { href: string; title: string | JSX.Element; nofollow?: boolean }) {
  return (
    <Link
      prefetch={false}
      href={href}
      target={href.startsWith("/") ? "" : "_blank"}
      rel={nofollow ? "nofollow" : undefined}
      className="pointer block w-fit hover:text-slate-900"
    >
      {title}
    </Link>
  );
}
