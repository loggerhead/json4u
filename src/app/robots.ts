import { MetadataRoute } from "next";
import { host } from "./sitemap";

// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // TODO: 正式上线后删除
      // allow: "/",
      disallow: "*",
    },
    sitemap: `${host}/sitemap.xml`,
  };
}
