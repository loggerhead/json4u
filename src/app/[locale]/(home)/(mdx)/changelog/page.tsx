import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("Changelog") };
}

export default async function Page({ params: { locale } }: { params: { locale: string } }) {
  const Content = (await import(`./${locale}.mdx`)).default;
  return <Content />;
}
