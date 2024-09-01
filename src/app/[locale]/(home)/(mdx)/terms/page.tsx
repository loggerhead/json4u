import { getTranslations } from "next-intl/server";
import EnContent from "./en.mdx";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("Terms") };
}

export default function Page() {
  return <EnContent />;
}
