import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import packageJSON from "../../package.json";

export const version = packageJSON.version;

const StatisticsSchema = z.object({
  graphModeView: z.number(),
  tableModeView: z.number(),
  textComparison: z.number(),
  jqExecutions: z.number(),
});

const SubscriptionVariantMapSchema = z.object({
  monthly: z.number(),
  yearly: z.number(),
});

export type Statistics = z.infer<typeof StatisticsSchema>;
export type StatisticsKeys = keyof Statistics;
export type SubscriptionVariantMap = z.infer<typeof SubscriptionVariantMapSchema>;

const stringToJSONSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP: stringToJSONSchema.pipe(SubscriptionVariantMapSchema),
    LEMONSQUEEZY_STORE_ID: z.coerce.number().min(1),
    LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1),
    LEMONSQUEEZY_API_KEY: z.string().min(1),
    SUPABASE_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().regex(/https?:\/\/(\w+\.)+\w+/g),
    NEXT_PUBLIC_SUPABASE_URL: z.string().regex(/https:\/\/\w+\.supabase\.\w+/g),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_FREE_QUOTA: stringToJSONSchema.pipe(StatisticsSchema),
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_FREE_QUOTA: process.env.NEXT_PUBLIC_FREE_QUOTA,
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
  },
});

export function isCN() {
  return env.NEXT_PUBLIC_APP_URL.endsWith(".cn");
}

export function isDev() {
  return process.env.NODE_ENV === "development";
}

export function isProd() {
  return process.env.NODE_ENV === "production";
}
