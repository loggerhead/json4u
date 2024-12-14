import Link from "next/link";
import LinkButton, { type Href } from "@/components/LinkButton";
import GitHub from "@/components/icons/GitHub";
import Logo from "@/components/icons/Logo";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Typography from "@/components/ui/typography";
import AccountButton from "@/containers/editor/sidenav/AccountButton";
import { isCN, version } from "@/lib/env";
import { useTranslations } from "next-intl";
import { Link as LinkTransition } from "next-view-transitions";

export default function Header() {
  const t = useTranslations("Home");
  const items = [
    // { href: "/#pricing", title: t("Pricing") },
    { href: "/tutorial", title: t("Tutorial") },
    { href: "/changelog", title: t("Changelog") },
  ];

  return (
    <div className="sticky top-0 z-10 bg-white flex md:h-12 h-14 items-center justify-center w-full border-b">
      <nav className="flex items-center w-full h-full max-w-page-header md:px-8 px-4">
        <Link prefetch={false} href="/" className="flex items-center gap-2 pointer mr-2">
          <Logo />
          <span className="font-bold">{"JSON For You"}</span>
        </Link>
        <Badge variant="secondary">{`v${version}`}</Badge>
        <div className="md:flex hidden items-center gap-4 ml-4">
          {items.map((item) => (
            <LinkTransition
              prefetch={false}
              href={item.href as Href}
              key={item.title}
              className="pointer block w-fit hover:text-sky-500"
              target={item.href.startsWith("/") ? "" : "_blank"}
            >
              <Typography variant="p" className="text-primary">
                {item.title}
              </Typography>
            </LinkTransition>
          ))}
        </div>
        <div className="ml-auto" />
        <div className="flex items-center h-full py-3 gap-4">
          {!isCN && <AccountButton notOnSideNav avatarClassName="w-8 h-8" />}
          <LinkButton href="/editor" variant="default">
            {t("Editor")}
          </LinkButton>
          <Separator className="md:flex hidden" orientation="vertical" />
          <Link className="md:flex hidden" href="https://github.com/loggerhead/json4u">
            <GitHub className="w-6 h-6" />
          </Link>
        </div>
      </nav>
    </div>
  );
}
