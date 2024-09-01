import { getStatistics, reportStatistics } from "@/app/actions";
import { env, isProd, type Statistics, type StatisticsKeys } from "@/lib/env";
import type { SubscriptionType } from "@/lib/shop/types";
import { supabase } from "@/lib/supabase/client";
import { OrderSchema, type Order } from "@/lib/supabase/table.types";
import { type FunctionKeys } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createContext } from "./context";
import { getStore } from "./utils";

const initialStatistics: Statistics = {
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
  nextQuotaRefreshTime: Date;
  fallbackKey: string;

  usable: (key: StatisticsKeys) => boolean;
  count: (key: StatisticsKeys) => void;
  isPremium: () => boolean;
  getPlan: () => SubscriptionType;
  logout: () => Promise<string | void>;
  setUser: (user: User | null) => Promise<void>;
  setStatistics: (statistics: Statistics, nextQuotaRefreshTime: Date, fallbackKey: string) => void;
}

const initialStates: Omit<UserState, FunctionKeys<UserState>> = {
  user: null,
  activeOrder: null,
  statistics: initialStatistics,
  nextQuotaRefreshTime: new Date(),
  fallbackKey: "",
};

export const {
  Provider: UserStoreProvider,
  useStoreCtx: useUserStoreCtx,
  useStore: useUserStore,
} = createContext(
  "userStore",
  () =>
    create<UserState>()((set, get) => ({
      ...initialStates,

      usable(key: StatisticsKeys) {
        const { statistics: usage, isPremium } = get();

        if (isPremium()) {
          return true;
        }

        return usage[key] < freeQuota[key];
      },

      count(key: StatisticsKeys) {
        const { fallbackKey, statistics, isPremium } = get();

        if (isPremium()) {
          return;
        }

        statistics[key] += 1;
        isProd() && reportStatistics(fallbackKey, key);
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

      async logout() {
        const { setUser } = get();
        const { error } = await supabase.auth.signOut();
        if (error) {
          return error.message;
        }

        await setUser(null);
        return;
      },

      async setUser(user: User | null) {
        if (user) {
          set({ user });

          const { order, error } = await getActiveOrder(user.email);
          if (error) {
            console.error("getActiveOrder failed:", error);
          }
          set({ activeOrder: order });
        } else {
          set({ user: null, activeOrder: null });
        }
      },

      setStatistics(statistics: Statistics, nextQuotaRefreshTime: Date, fallbackKey: string) {
        set({ statistics, nextQuotaRefreshTime, fallbackKey });
      },
    })),

  (store) => {
    const { setUser, setStatistics } = store.getState();

    (async () => {
      try {
        const fallbackKey = (await getPublicIP()) ?? "";
        const { statistics, expiredAt } = await getStatistics(fallbackKey);
        setStatistics({ ...initialStatistics, ...statistics }, expiredAt, fallbackKey);
      } catch (error) {
        console.error("getStatistics failed:", error);
      }
    })();

    (async () => {
      const { data } = await supabase.auth.getSession();
      await setUser(data.session?.user ?? null);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      await setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  },
);

export function getUserState() {
  return getStore("userStore").getState();
}

async function getActiveOrder(email: string | undefined) {
  if (!email) {
    return { order: null, error: null };
  }

  // API: https://supabase.com/docs/reference/javascript/select
  const { data, error } = await supabase.from("orders").select().eq("email", email).neq("plan", "free").maybeSingle();
  if (error) {
    return { order: null, error };
  }

  const r = OrderSchema.safeParse(data);

  if (!r.success) {
    return { order: null, error: r.error };
  }
  return { order: r.data, error: null };
}

async function getPublicIP() {
  try {
    const resp = await fetch("https://api64.ipify.org");
    return await resp.text();
  } catch (error) {
    console.error("failed to get public IP:", error);
  }
}
