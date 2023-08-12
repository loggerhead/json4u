import Head from "next/head";
import Script from "next/script";
import Footer from "../components/footer";
import "./globals.scss";

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
    <html>
      <Head>
        <GoogleTagManagerHead></GoogleTagManagerHead>
      </Head>
      <body>
        <main>{children}</main>
        <Footer></Footer>
        <GoogleTagManagerBody></GoogleTagManagerBody>
      </body>
    </html>
  );
}

function GoogleTagManagerHead() {
  return (
    <Script
      id="gtm-head"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-T58W8WZ4');</script>`,
      }}
    />
  );
}

function GoogleTagManagerBody() {
  return (
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-T58W8WZ4"
        height="0"
        width="0"
        style={{
          display: "none",
          visibility: "hidden",
        }}
      ></iframe>
    </noscript>
  );
}
