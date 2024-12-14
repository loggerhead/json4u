import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { env, isCN } from "@/lib/env";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    alternates: {
      canonical: "/",
      languages: {
        en: "https://json4u.com",
        zh: "https://json4u.cn",
        "x-default": isCN ? "/zh" : "/en",
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
      images: [{ url: `${env.NEXT_PUBLIC_APP_URL}/apple-icon.png`, width: 512, height: 512, alt: t("name") }],
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
      creator: "@1oggerhead",
      images: [`${env.NEXT_PUBLIC_APP_URL}/apple-icon.png`],
    },
  };
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ViewTransitions>
      <html lang={locale} suppressHydrationWarning>
        <body>
          {/* TODO: support dark theme */}
          <ThemeProvider defaultTheme="light" disableTransitionOnChange>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </ThemeProvider>
          <Toaster richColors position="bottom-right" />
        </body>
        <GoogleAnalytics gaId="G-TLYE3CBLPW" />
      </html>
    </ViewTransitions>
  );
}
