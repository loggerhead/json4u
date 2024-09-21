import LinkButton from "@/components/LinkButton";
import Typography from "@/components/ui/typography";
import { useTranslations } from "next-intl";

export default function LoginError() {
  const t = useTranslations("LoginError");

  return (
    <main className="flex items-center justify-center w-screen">
      <div className="flex flex-col items-center justify-center gap-6">
        <Typography variant="h2">{t("login_error")}</Typography>
        <LinkButton href="/">
          <Typography variant="h5">{t("go_back_home")}</Typography>
        </LinkButton>
      </div>
    </main>
  );
}
