import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("Changelog") };
}

export default async function Page() {
  const locale = await getLocale();
  const Content = (await import(`./${locale}.mdx`)).default;
  return <Content />;
}
