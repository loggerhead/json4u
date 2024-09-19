import { getLocale, getTranslations } from "next-intl/server";
import EnContent from "./en.mdx";

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("Terms") };
}

export default function Page() {
  return <EnContent />;
}
