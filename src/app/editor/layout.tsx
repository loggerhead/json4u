import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("Editor") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <main className="w-screen h-screen">{children}</main>;
}
