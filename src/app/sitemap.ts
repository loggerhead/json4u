import { MetadataRoute } from "next";
import { env } from "@/lib/env";

// https://next-intl-docs.vercel.app/docs/environments/metadata-route-handlers
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    getEntry("/"),
    getEntry("/editor"),
    getEntry("/changelog"),
    getEntry("/terms"),
    getEntry("/privacy"),
    getEntry("/tutorial"),
  ];
}

function getEntry(pathname: string) {
  return {
    url: getUrl(pathname),
    lastModified: new Date(),
    alternates: {
      languages: {
        en: getUrl(pathname, "https://json4u.com"),
        zh: getUrl(pathname, "https://json4u.cn"),
      },
    },
  };
}

function getUrl(pathname: string, appURL: string = env.NEXT_PUBLIC_APP_URL) {
  return `${appURL}/${pathname.startsWith("/") ? pathname.slice(1) : pathname}`;
}
