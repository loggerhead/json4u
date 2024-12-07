"use client";

import { type Config, defaultConfig } from "@/lib/db/config";
import { tryCatch } from "@/lib/utils";
import { useCookies } from "next-client-cookies";

export function useConfigFromCookies() {
  const cookies = useCookies();
  return tryCatch<Config>(() => JSON.parse(cookies.get("config")!)["state"], defaultConfig);
}
