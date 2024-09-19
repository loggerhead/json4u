import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Home" });

  return { title: t("login") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
