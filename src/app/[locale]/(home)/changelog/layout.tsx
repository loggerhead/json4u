import "github-markdown-css";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("Changelog") };
}

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="markdown-body relative w-full bg-white shadow-xl shadow-slate-700/10 ring-1 ring-gray-900/5 p-8 md:max-w-3xl md:mx-auto lg:max-w-4xl">
      <div className="mt-8 prose prose-slate mx-auto lg:prose-lg">{children}</div>
    </div>
  );
}
