import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";
import { Database, Json } from "./database.types";
import type { Order } from "./table.types";

// On the server, it basically configures a fetch call.
// You need to reconfigure the fetch call anew for every request to your server,
// because you need the cookies from the request.
export function createClient() {
  const cookieStore = cookies();

  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export class Db {
  client: ReturnType<typeof createClient>;

  constructor(client: ReturnType<typeof createClient> = createClient()) {
    this.client = client;
  }

  async getAuthenticatedUser() {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (!user) {
      throw new Error("user is not authenticated.");
    } else if (!user.email) {
      throw new Error(`miss user email. user=${JSON.stringify(user)}`);
    }
    return user;
  }

  async get(key: string): Promise<{ value: Json; expiredAt?: Date }> {
    const { data, error } = await this.client.from("kv").select().eq("key", key).maybeSingle();
    if (error) {
      throw error;
    }

    const value = data?.value as string;
    const expiredAt = data?.expired_at;

    return {
      value: value ? JSON.parse(value) : undefined,
      expiredAt: expiredAt ? new Date(expiredAt) : undefined,
    };
  }

  async set(key: string, value: any, expiredAt?: Date) {
    const expired_at = expiredAt ? expiredAt.toISOString() : undefined;

    const { error } = await this.client
      .from("kv")
      .upsert({
        key,
        value: JSON.stringify(value),
        expired_at,
      })
      .eq("key", key);
    if (error) throw error;
  }

  async upsertOrder(order: Order) {
    const { error } = await this.client.from("orders").upsert(toTableOrder(order));
    if (error) throw error;
  }

  async updateOrder(order: Order) {
    const { error } = await this.client.from("orders").update(toTableOrder(order)).eq("id", order.id);
    if (error) throw error;
  }
}

function toTableOrder(order: Order) {
  return {
    ...order,
    renews_at: order.renews_at.toISOString(),
    ends_at: order.ends_at?.toISOString() ?? null,
  };
}
