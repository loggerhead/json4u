"use server";

import { headers } from "next/headers";
import { env, type Statistics, type StatisticsKeys } from "@/lib/env";
import { createClient, Db } from "@/lib/supabase/server";
import { createCheckout, listCustomers } from "@lemonsqueezy/lemonsqueezy.js";
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export async function getCheckoutURL(subscriptionType: "monthly" | "yearly", redirectUrl?: string) {
  setupLemonSqueezy();
  const user = await new Db().getAuthenticatedUser();
  const variantId = env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP[subscriptionType];

  const { data, error } = await createCheckout(env.LEMONSQUEEZY_STORE_ID, variantId, {
    checkoutOptions: {
      embed: true,
      media: false,
      logo: false,
      desc: false,
    },
    checkoutData: {
      email: user.email,
      name: user.user_metadata?.name,
    },
    productOptions: {
      enabledVariants: [
        env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP.monthly,
        env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP.yearly,
      ],
      redirectUrl: redirectUrl,
      receiptLinkUrl: redirectUrl,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data?.data?.attributes?.url ?? "";
}

// Get a URL to the Customer Portal, which allows customers to fully manage their subscriptions
// and billing information. The URL is valid for 24 hours from time of request.
// Will be null if the customer has not bought a subscription.
export async function getCustomerPortalURL() {
  setupLemonSqueezy();
  const user = await new Db().getAuthenticatedUser();
  const { data, error } = await listCustomers({ filter: { storeId: env.LEMONSQUEEZY_STORE_ID, email: user.email } });

  if (error) {
    throw new Error(error.message);
  }

  const customer = data?.data?.[0]?.attributes;
  const url = customer?.urls?.customer_portal;
  return url ?? "";
}

export async function getStatistics(fallbackKey: string) {
  const { statistics, expiredAt } = await doGetStatistics(fallbackKey);
  return { statistics, expiredAt };
}

export async function reportStatistics(fallbackKey: string, k: StatisticsKeys) {
  const { db, key, statistics, expiredAt } = await doGetStatistics(fallbackKey);
  statistics[k] = (statistics[k] ?? 0) + 1;
  await db.set(key, statistics, expiredAt);
}

async function doGetStatistics(fallbackKey: string): Promise<{
  db: Db;
  key: string;
  statistics: Statistics;
  expiredAt: Date;
}> {
  const key = getStatisticsKey(fallbackKey);
  const db = new Db(createClient());
  const { value, expiredAt: oldExpiredAt } = await db.get(key);

  const newStatistics = {};
  const newExpiredAt = new Date();
  newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);

  const statistics = (value as unknown as Statistics) ?? newStatistics;
  const expiredAt = oldExpiredAt ?? newExpiredAt;
  return { db, key, statistics, expiredAt };
}

// WARNING: Not secure, but the current business scenarios can tolerate users taking advantage.
function getStatisticsKey(fallbackKey: string): string {
  const key = getIP() ?? fallbackKey;
  if (!key) {
    throw new Error("generate statistics key failed.");
  }
  return "stats:" + key;
}

function getIP(): string | undefined {
  const hh = ["x-forwarded-for", "x-real-ip", "forwarded", "cf-connecting-ip"];
  const ips = [];

  for (const header in hh) {
    const ip = headers().get(header);
    ips.push(ip);

    if (ip && isValidPublicIP(ip)) {
      console.log(`get remote ip from "${header}": ${ip}`);
      return ip;
    }
  }

  console.error(`cannot get remote ip: [${ips}]`);
  return;
}

function isValidPublicIP(ip: string) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;

  if (ipv4Regex.test(ip)) {
    const pp = ip.split(".");
    return !(
      pp[0] === "10" ||
      (pp[0] === "172" && Number(pp[1]) >= 16 && Number(pp[1]) <= 31) ||
      (pp[0] === "192" && pp[1] === "168")
    );
  }

  if (ipv6Regex.test(ip)) {
    const pp = ip.split(":");
    return pp[0] !== "fc00";
  }

  return false;
}

function setupLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: env.LEMONSQUEEZY_API_KEY,
    onError: (error) => {
      throw new Error(`Lemon Squeezy API error: ${error.message}`);
    },
  });
}
