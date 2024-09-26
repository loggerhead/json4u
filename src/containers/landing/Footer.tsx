import Link from "next/link";
import { type Href } from "@/components/LinkButton";
import GitHub from "@/components/icons/GitHub";
import Logo from "@/components/icons/Logo";
import Twitter from "@/components/icons/Twitter";
import Weibo from "@/components/icons/Weibo";
import Typography from "@/components/ui/typography";
import { isCN } from "@/lib/env";
import { filter } from "lodash-es";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Home");
  const items: FooterLinkProps[] = [
    { href: "https://www.trustpilot.com/review/json4u.com", title: t("Give a rating") },
    { href: "https://github.com/loggerhead/json4u/issues/new", title: t("Feedback") },
    isCN
      ? { href: "https://weibo.com/loggerhead", title: <Weibo className="icon" /> }
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
        <FriendLinks />
        <div className="ml-auto lg:flex hidden gap-8">
          {items.map((item, i) => (
            <FooterLink key={i} title={item.title} href={item.href} />
          ))}
        </div>
      </div>
    </footer>
  );
}

function FriendLinks() {
  const t = useTranslations("Home");
  const friends = filter([isCN ? { href: "https://www.apiyi.com", title: "API易" } : undefined]) as FooterLinkProps[];

  if (friends.length === 0) {
    return null;
  }

  return (
    <div className="lg:flex hidden items-center justify-center gap-1">
      <Typography>{t("Friends")}</Typography>
      {friends.map((item, i) => (
        <FooterLink key={i} title={item.title} href={item.href} />
      ))}
    </div>
  );
}

function Legal() {
  const t = useTranslations("Home");

  // TODO: modify content. change back to flex
  return (
    <div className="hidden items-center lg:gap-8 lg:ml-0 ml-auto gap-4">
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
