"use client";

import React, { RefObject, useRef, useState } from "react";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Typography from "@/components/ui/typography";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import { toastErr, toastSucc } from "@/lib/utils";
import { useRouter } from "@/navigation";
import { useUserStore } from "@/stores/userStore";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useCountdown } from "usehooks-ts";
import { z } from "zod";

const initialSeconds = 30;
const FormSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6),
});

type FormData = z.infer<typeof FormSchema>;

interface EmailLoginButtonProps {
  redirectTo: string;
}

export default function EmailLoginButton({ redirectTo }: EmailLoginButtonProps) {
  const t = useTranslations("Home");
  const captchaRef = useRef<HCaptcha>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });
  const [email] = form.watch(["email"]);
  const { pending, isCounting, countdown, sendOTP } = useSendOTP(captchaRef, email);
  const { loading, onVerifyOTP } = useVerifyOTP(redirectTo);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onVerifyOTP)} className="w-full">
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email_label")}</FormLabel>
                  <FormControl>
                    <Input className="py-5" disabled={loading} placeholder={t("email_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage errorMessage={t("invalid_email_error")} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("otp_label")}</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage errorMessage={t("invalid_otp_error")}>{t("email_otp_placeholder")}</FormMessage>
                </FormItem>
              )}
            />

            <div className="flex w-full gap-3 mt-2">
              <Button
                className="flex-1 py-5 gap-1"
                variant="default"
                disabled={pending || isCounting}
                onClick={async (ev) => {
                  ev.preventDefault();
                  await sendOTP();
                }}
              >
                <Typography>{t("send_email_otp")}</Typography>
                {isCounting && <Typography className="mono-font">{`(${countdown}s)`}</Typography>}
              </Button>
              <LoadingButton className="flex-1 py-5" type="submit" variant="default" loading={loading}>
                <Typography>{t("login")}</Typography>
              </LoadingButton>
            </div>

            <HCaptcha
              ref={captchaRef}
              sitekey={env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
              size="invisible"
              onError={(ev) => toastErr(t("captcha_error", { message: ev }))}
            />
          </div>
        </form>
      </Form>
    </>
  );
}

function useVerifyOTP(redirectTo: string) {
  const t = useTranslations("Home");
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  const onVerifyOTP = async ({ email, otp }: FormData) => {
    setLoading(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    setLoading(false);

    if (error) {
      toastErr(t("login_failed", { message: error.code === "otp_expired" ? t("verify_otp_error") : error.message }));
      return;
    }

    toastSucc(t("login_succ"));
    setUser(session?.user ?? null);
    router.push(redirectTo);
  };

  return { loading, onVerifyOTP };
}

function useSendOTP(captchaRef: RefObject<HCaptcha>, email: string) {
  const t = useTranslations("Home");
  const [pending, setPending] = useState(false);
  const [count, { startCountdown, resetCountdown }] = useCountdown({
    countStart: initialSeconds,
    intervalMs: 1000,
  });

  const sendOTP = async () => {
    const res = await captchaRef.current?.execute({ async: true });
    const captchaToken = res?.response ?? "";

    setPending(true);
    captchaRef.current?.resetCaptcha();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { captchaToken },
    });

    if (error) {
      setPending(false);
      toastErr(t("send_otp_failed", { message: error.message }));
      return;
    }

    resetCountdown();
    startCountdown();
    // wait > 1s to show the countdown
    setTimeout(() => setPending(false), 1500);
  };

  return {
    pending,
    isCounting: 0 < count && count < initialSeconds,
    countdown: count,
    sendOTP,
  };
}
