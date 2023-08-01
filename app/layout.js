import "./globals.css";

const title = "JSON For You";
const description =
  "在线快速对比 JSON 差异，进行语义化、结构化比较。支持 64 位大整数 (bigint)、逐字符比较、大文件对比。同时支持 JSON 格式化、压缩、校验";
const creator = "loggerhead";

// SEO: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#generatemetadata-function
export function generateMetadata({ params, searchParams }, parent) {
  return {
    metadataBase: new URL("https://json4u.com"),
    alternates: {
      canonical: "/",
    },
    title: title,
    description: description,
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
    openGraph: {
      siteName: title,
      title: title,
      description: description,
      url: "/",
      images: ["/icon.png"],
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary",
      url: "/",
      title: title,
      description: description,
      creator: creator,
      images: ["/icon.png"],
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <main>{children}</main>
        <div className="my-3 text-center text-[12px]">
          <a href="/">Json For You · </a>
          <a href="https://beian.miit.gov.cn" target="_blank">
            粤ICP备16007488号 ·{" "}
          </a>
          <a href="/guide">使用指南 · </a>
          <a href="https://github.com/loggerhead/json4u-issue/issues">Feedback</a>
        </div>
      </body>
    </html>
  );
}
