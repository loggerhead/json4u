import type { Status, SubscriptionType } from "@/lib/shop/types";
import type { MergeDeep } from "type-fest";
import { z } from "zod";
import type { Tables } from "./database.types";

export type Order = Omit<
  MergeDeep<
    Tables<"orders">,
    {
      status: Status;
      plan: SubscriptionType;
      renews_at: Date;
      ends_at?: Date | null;
    }
  >,
  "created_at" | "updated_at"
>;

// TODO: fix z.object<Order> does not satisfy the constraint problem
export const OrderSchema = z.object({
  id: z.number(),
  email: z.string().min(1),
  status: z.enum(["on_trial", "active", "paused", "past_due", "unpaid", "cancelled", "expired"]),
  plan: z.enum(["free", "trial", "monthly", "yearly"]),
  subscription_id: z.number(),
  variant_id: z.number(),
  renews_at: z.string().transform((str) => new Date(str)),
  ends_at: z
    .string()
    .transform((str) => new Date(str))
    .nullable()
    .optional(),
});
