import Background from "@/components/Background";
import LinkButton from "@/components/LinkButton";
import Section from "@/components/Section";
import Typography from "@/components/ui/typography";
import { isCN } from "@/lib/env";
import { useTranslations } from "next-intl";

export default function Title() {
  const t = useTranslations("Home");

  return (
    <Section className="relative mx-0 py-32">
      <div className="flex flex-col items-center text-center md:mx-32 mx-0">
        <Typography
          variant="h1"
          className="max-w-4xl mb-6"
          style={{ fontFamily: '"Inter Display SemiBold", "Inter Display SemiBold Placeholder", sans-serif' }}
        >
          {t.rich("landing_title")}
        </Typography>
        <Typography
          variant="h5"
          className="max-w-xl mb-8"
          style={{ fontFamily: '"Noto Sans", "Noto Sans Placeholder", sans-serif', color: "#555a6a" }}
        >
          {t("landing_subtitle")}
        </Typography>
        <LinkButton className="mb-6 h-10" size="lg" variant="default" href="/editor">
          <Typography variant="h5">{t("try_now")}</Typography>
        </LinkButton>
        <video
          width="1280"
          height="720"
          className="mt-8 rounded-md shadow-2xl border sm:mt-12 block"
          src={isCN ? "https://o.json4u.cn/json4u.mp4" : "https://o.json4u.com/json4u.mp4"}
          poster="/example/json4u.webp"
          autoPlay
          loop
          muted
        />
      </div>
      <Background variant="dots" size={20} />
    </Section>
  );
}
