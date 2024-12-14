import Link from "next/link";
import { type Href } from "@/components/LinkButton";
import GitHub from "@/components/icons/GitHub";
import Logo from "@/components/icons/Logo";
import Twitter from "@/components/icons/Twitter";
import Weibo from "@/components/icons/Weibo";
import { isCN } from "@/lib/env";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Home");
  const items: FooterLinkProps[] = [
    { href: "https://www.trustpilot.com/review/json4u.com", title: t("Give a rating") },
    ...(isCN
      ? [
          { href: "https://support.qq.com/product/670462", title: t("Feedback") },
          { href: "https://weibo.com/loggerhead", title: <Weibo className="icon" /> },
        ]
      : [
          { href: "https://github.com/loggerhead/json4u/issues/new", title: t("Feedback") },
          { href: "https://x.com/1oggerhead", title: <Twitter className="icon" /> },
        ]),
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
        <div className="ml-auto lg:flex hidden gap-8">
          {items.map((item, i) => (
            <FooterLink key={i} title={item.title} href={item.href} />
          ))}
        </div>
      </div>
    </footer>
  );
}

function Legal() {
  const t = useTranslations("Home");

  return (
    <div className="flex items-center lg:gap-8 lg:ml-0 ml-auto gap-4">
      {isCN ? (
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

interface FooterLinkProps {
  href: string;
  title: string | JSX.Element;
  nofollow?: boolean;
}

function FooterLink({ href, title, nofollow }: FooterLinkProps) {
  return (
    <Link
      prefetch={false}
      href={href as Href}
      target={href.startsWith("/") ? "" : "_blank"}
      rel={nofollow ? "nofollow noopener" : "noopener"}
      className="pointer block w-fit hover:text-slate-900"
    >
      {title}
    </Link>
  );
}
