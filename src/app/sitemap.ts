import { MetadataRoute } from "next";

export const locales = ["en", "zh"];

// https://next-intl-docs.vercel.app/docs/environments/metadata-route-handlers
export default function sitemap(): MetadataRoute.Sitemap {
  return [getEntry("/"), getEntry("/editor"), getEntry("/changelog")];
}

function getEntry(pathname: string) {
  const defaultLocale = "en";

  return {
    url: getUrl(pathname, defaultLocale),
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, getUrl(pathname, locale)])),
    },
  };
}

function getUrl(pathname: string, locale: string) {
  const host = locale === "zh" ? "https://json4u.cn" : "https://json4u.com";
  return `${host}/${locale}${pathname === "/" ? "" : pathname}`;
}
