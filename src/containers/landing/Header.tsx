import Link from "next/link";
import LinkButton, { type Href } from "@/components/LinkButton";
import Logo from "@/components/icons/Logo";
import Typography from "@/components/ui/typography";
import AccountButton from "@/containers/editor/sidenav/AccountButton";
import { isCN } from "@/lib/env";
import { useTranslations } from "next-intl";

export default function Header() {
  const t = useTranslations("Home");
  const items = [
    // TODO: redesign
    // { href: "/#features", title: t("Features") },
    // { href: "/#pricing", title: t("Pricing") },
    { href: "/#faq", title: t("FAQ") },
    { href: "/changelog", title: t("Changelog") },
  ];

  return (
    <div className="flex md:h-12 h-14 items-center justify-center w-full border-b">
      <nav className="flex items-center w-full h-full max-w-page-header md:px-8 px-4">
        <Link prefetch={false} href="/" className="flex items-center gap-2 pointer mr-8">
          <Logo />
          <span className="font-bold">{"JSON For You"}</span>
        </Link>
        <div className="items-center lg:gap-8 gap-4 md:flex hidden">
          {items.map((item) => (
            <Link
              prefetch={false}
              href={item.href as Href}
              key={item.title}
              className="pointer block w-fit hover:text-sky-500"
              target={item.href.startsWith("/") ? "" : "_blank"}
            >
              <Typography variant="p" className="text-primary">
                {item.title}
              </Typography>
            </Link>
          ))}
        </div>
        <div className="flex ml-auto items-center gap-4">
          {!isCN && <AccountButton notOnSideNav avatarClassName="w-8 h-8" />}
          <LinkButton variant="default" href="/editor">
            <Typography variant="p">{t("Editor")}</Typography>
          </LinkButton>
        </div>
      </nav>
    </div>
  );
}
