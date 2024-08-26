import createMiddleware from "next-intl/middleware";
import { localePrefix, locales } from "./navigation";

export default createMiddleware({
  defaultLocale: "en",
  localePrefix,
  locales,
});

// https://next-intl-docs.vercel.app/docs/routing/middleware#matcher-config
export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(en|zh)", "/(en|zh)/:path*"],
};
