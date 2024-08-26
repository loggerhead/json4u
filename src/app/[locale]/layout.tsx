import Script from "next/script";
import "@/app/globals.css";
import { host } from "@/app/sitemap";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "next-themes";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(host),
    alternates: {
      canonical: "/",
      languages: {
        en: "https://json4u.com",
        zh: "https://json4u.cn",
        "x-default": host.endsWith(".cn") ? "/zh" : "/en",
      },
    },
    applicationName: t("name"),
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    keywords: t("keywords"),
    description: t("description"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("title"),
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: "website",
      siteName: t("name"),
      title: t("title"),
      description: t("description"),
      authors: ["loggerhead"],
      images: [{ url: `${host}/apple-icon.png`, width: 512, height: 512, alt: t("name") }],
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
      creator: "@1oggerhead",
      images: [`${host}/apple-icon.png`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <GoogleTagManagerHead />
      <body>
        {/* TODO: support dark theme */}
        <ThemeProvider defaultTheme="light" disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          <GoogleTagManagerBody />
        </ThemeProvider>
      </body>
    </html>
  );
}

function GoogleTagManagerHead() {
  // https://nextjs.org/docs/pages/api-reference/components/script#strategy
  return (
    <Script id="gtm-head">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-T58W8WZ4');`}
    </Script>
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
