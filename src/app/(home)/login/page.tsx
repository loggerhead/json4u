import { Suspense } from "react";
import Link from "next/link";
import Background from "@/components/Background";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Typography from "@/components/ui/typography";
import OAuthButton from "@/containers/login/OAuthButton";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Home");

  return (
    <Suspense>
      <Card className="mx-auto w-[400px] h-fit">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-center">
              <Typography variant="h3">{t("login")}</Typography>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <OAuthButton provider="google" />
            <OAuthButton provider="github" />
            <div className="my-4 flex items-center gap-2">
              <Separator className="flex-1" />
              <Typography affects="xs">{t("or")}</Typography>
              <Separator className="flex-1" />
            </div>
            {/* TODO: temp disable */}
            {/* <EmailForm /> */}
          </div>
        </CardContent>
        <CardFooter>
          <Typography affects="xs">
            {t.rich("before_login_statement", {
              terms: (chunks) => (
                <Link className="text-blue-500" href="/terms">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link className="text-blue-500" href="/privacy">
                  {chunks}
                </Link>
              ),
            })}
          </Typography>
        </CardFooter>
      </Card>
      <Background size={40} />
    </Suspense>
  );
}
