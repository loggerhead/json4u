import { isCN } from "@/lib/env";
import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "zh"];

export default getRequestConfig(async () => {
  const locale = isCN() ? "zh" : "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
