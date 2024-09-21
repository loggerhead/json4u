import LinkButton from "@/components/LinkButton";
import Typography from "@/components/ui/typography";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className="flex items-center justify-center w-screen h-screen">
      <div className="flex flex-col items-center justify-center gap-6">
        <Typography variant="h2">{t("not_found")}</Typography>
        <LinkButton href="/">
          <Typography variant="h5">{t("go_back_home")}</Typography>
        </LinkButton>
      </div>
    </main>
  );
}
