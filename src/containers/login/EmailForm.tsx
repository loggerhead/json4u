"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Typography from "@/components/ui/typography";
import { supabase } from "@/lib/supabase/client";
import { toastErr, toastSucc } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useCountdown } from "usehooks-ts";
import { z } from "zod";
import useRedirectTo from "./useRedirectTo";

const resendInterval = 30;
const FormSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6),
});

type FormData = z.infer<typeof FormSchema>;

export default function EmailForm() {
  const t = useTranslations("Home");
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });
  const [email] = form.watch(["email"]);
  const { pending, isCounting, countdown, sendOTP } = useSendOTP(email);
  const { loading, onVerifyOTP } = useVerifyOTP();

  return (
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
        </div>
      </form>
    </Form>
  );
}

function useVerifyOTP() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const redirectTo = useRedirectTo();

  const onVerifyOTP = async ({ email, otp }: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    sendGAEvent("event", "login", {
      channel: "email",
      error: error?.message ?? "succ",
    });

    setLoading(false);

    if (error) {
      toastErr(t("login_failed", { message: error.code === "otp_expired" ? t("verify_otp_error") : error.message }));
      return;
    }

    toastSucc(t("login_succ"));
    // @ts-ignore
    router.push(redirectTo);
  };

  return { loading, onVerifyOTP };
}

function useSendOTP(email: string) {
  const t = useTranslations("Home");
  const [pending, setPending] = useState(false);
  const [count, { startCountdown, resetCountdown }] = useCountdown({
    countStart: resendInterval,
    intervalMs: 1000,
  });

  const sendOTP = async () => {
    setPending(true);
    const { error } = await supabase.auth.signInWithOtp({ email });

    sendGAEvent("event", "send_otp", {
      error: error?.message ?? "succ",
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
    isCounting: 0 < count && count < resendInterval,
    countdown: count,
    sendOTP,
  };
}
