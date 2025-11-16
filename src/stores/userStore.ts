import { reportStatistics } from "@/app/actions";
import { env, isCN, isDev, type Statistics, type StatisticsKeys } from "@/lib/env";
import type { SubscriptionType } from "@/lib/shop/types";
import { supabase } from "@/lib/supabase/client";
import { OrderSchema, type Order } from "@/lib/supabase/table.types";
import { type FunctionKeys } from "@/lib/utils";
import { sendGAEvent } from "@next/third-parties/google";
import type { User } from "@supabase/supabase-js";
import { last, sortBy } from "lodash-es";
import { create } from "zustand";

export const initialStatistics: Statistics = {
  graphModeView: 0,
  tableModeView: 0,
  textComparison: 0,
  jqExecutions: 0,
};

export const freeQuota: Readonly<Statistics> = env.NEXT_PUBLIC_FREE_QUOTA;

export interface UserState {
  user: User | null;
  activeOrder: Order | null;
  statistics: Statistics;
  nextQuotaRefreshTime?: Date;
  fallbackKey: string;

  usable: (key: StatisticsKeys) => boolean;
  count: (key: StatisticsKeys) => void;
  isPremium: () => boolean;
  getPlan: () => SubscriptionType;
  setUser: (user: User | null) => Promise<void>;
  updateActiveOrder: (user: User | null) => Promise<void>;
  setStatistics: (statistics: Statistics, nextQuotaRefreshTime: Date, fallbackKey: string) => void;
}

const initialStates: Omit<UserState, FunctionKeys<UserState>> = {
  user: null,
  activeOrder: null,
  statistics: initialStatistics,
  fallbackKey: "",
};

export const useUserStore = create<UserState>()((set, get) => ({
  ...initialStates,

  usable(key: StatisticsKeys) {
    const { statistics: usage, isPremium } = get();

    if (isPremium()) {
      return true;
    }

    // TODO: free now
    return true || usage[key] < freeQuota[key];
  },

  count(key: StatisticsKeys) {
    const { fallbackKey, statistics, isPremium } = get();
    statistics[key] += 1;

    // can't connect to supabase in China, so disable the function temporarily
    if (!(isPremium() || isDev || isCN)) {
      reportStatistics(fallbackKey, key);
    }

    sendGAEvent("event", "cmd_statistics", { name: key });
    set({ statistics });
  },

  isPremium() {
    const { getPlan } = get();
    switch (getPlan()) {
      case "monthly":
        return true;
      case "yearly":
        return true;
      default:
        return false;
    }
  },

  getPlan(): SubscriptionType {
    const { activeOrder } = get();
    return activeOrder?.plan ?? "free";
  },

  async setUser(user: User | null) {
    if (user) {
      set({ user });
      await get().updateActiveOrder(user);
    } else {
      set(initialStates);
    }
  },

  async updateActiveOrder(user: User | null) {
    if (!user) {
      set({ activeOrder: null });
      return;
    }

    const { order, error } = await getActiveOrder(user.email);
    if (error) {
      console.error("getActiveOrder failed:", error);
    }
    set({ activeOrder: order });
  },

  setStatistics(statistics: Statistics, nextQuotaRefreshTime: Date, fallbackKey: string) {
    set({ statistics, nextQuotaRefreshTime, fallbackKey });
  },
}));

export function getUserState() {
  return useUserStore.getState();
}

// TODO: Think about how to keep multiple subscriptions mutually exclusive
async function getActiveOrder(email: string | undefined): Promise<{
  order: Order | null;
  error: string | null;
}> {
  if (!email) {
    return { order: null, error: null };
  }

  // API: https://supabase.com/docs/reference/javascript/select
  const { data: items, error } = await supabase
    .from("orders")
    .select()
    .eq("email", email)
    .neq("plan", "free")
    .order("created_at", { ascending: false });
  if (error) {
    return { order: null, error: error.toString() };
  }

  try {
    const orders = items.map((item) => OrderSchema.parse(item));

    for (const order of orders) {
      if (order.status === "active") {
        return { order, error: null };
      }
    }

    const order = last(sortBy(orders, "ends_at")) ?? null;
    return { order, error: null };
  } catch (error) {
    return { order: null, error: (error as Error).toString() };
  }
}
