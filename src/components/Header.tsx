"use client";

import Typography from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { usePathname } from "@/navigation";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import Logo from "./icons/Logo";

export function Header() {
  const t = useTranslations("Home");
  const pathname = usePathname();
  const items = [
    { href: "/#features", title: t("Features") },
    /* TODO: display */
    // { href: "/#pricing", title: t("Pricing") },
    { href: "/changelog", title: t("Changelog") },
  ];

  return (
    <div className="flex md:h-12 h-14 items-center justify-center w-full border-b">
      <div className="flex items-center w-full h-full max-w-page-header md:px-8 px-4 gap-x-8">
        <Link prefetch={false} href="/" className="flex items-center gap-2 pointer">
          <Logo />
          <span className="font-bold">{"JSON For You"}</span>
        </Link>
        {items.map((item) => (
          <Link
            prefetch={false}
            href={item.href}
            key={item.title}
            className="pointer block w-fit hover:text-sky-500"
            target={item.href.startsWith("/") ? "" : "_blank"}
          >
            <Typography
              variant="p"
              className={cn((pathname === item.href || pathname.includes(item.href)) && "text-primary")}
            >
              {item.title}
            </Typography>
          </Link>
        ))}
        <div className="ml-auto" />
        <Link href="/editor" className="pointer block w-fit hover:text-sky-500">
          <Typography variant="p">{t("Editor")}</Typography>
        </Link>
        {/* TODO: support login via github, google */}
        {/* <Link prefetch={false} href="/" target="_blank">
                <Typography variant="p">{"Login"}</Typography>
              </Link>
              <Link prefetch={false} href="/" target="_blank">
                <Typography variant="p">{"Sign Up"}</Typography>
              </Link> */}
      </div>
    </div>
  );
}
