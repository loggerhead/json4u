import { isCN } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";
import { createMiddleware, type MiddlewareFunctionProps } from "@rescale/nemo";
import createIntlMiddleware from "next-intl/middleware";
import { localePrefix, locales } from "./navigation";

const i18n = createIntlMiddleware({
  defaultLocale: isCN() ? "zh" : "en",
  localePrefix,
  locales,
});

const i18nHandler = async ({ request }: MiddlewareFunctionProps) => await i18n(request);

const middlewares = {
  "/": [i18nHandler, updateSession],
  "/(en|zh){/:path}*": [i18nHandler, updateSession],
  "/api": [updateSession],
};

export const middleware = createMiddleware(middlewares);

export const config = {
  // Match all pathnames except for
  // - if they start with `/_next` or `/_vercel`
  // - the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
