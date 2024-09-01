import { z } from "zod";
import { SubscriptionItem } from "./subscriptionItem";

const StatusSchema = z.enum(["on_trial", "active", "paused", "past_due", "unpaid", "cancelled", "expired"]);

export type Status = z.infer<typeof StatusSchema>;

const Pause = z.object({
  mode: z.enum(["void", "free"]).optional(),
  resumes_at: z.coerce.date().optional(),
});

const Urls = z.object({
  update_payment_method: z.string(),
  customer_portal: z.string(),
  update_customer_portal: z.string().nullable().optional(),
  customer_portal_update_subscription: z.string().nullable().optional(),
});

// https://docs.lemonsqueezy.com/api/subscriptions#the-subscription-object
export const Subscription = z.object({
  store_id: z.number(),
  customer_id: z.number(),
  order_id: z.number(),
  order_item_id: z.number(),
  product_id: z.number(),
  variant_id: z.number(),
  product_name: z.string(),
  variant_name: z.string(),
  user_name: z.string(),
  user_email: z.string(),
  status: StatusSchema,
  status_formatted: z.string(),
  card_brand: z.string().nullable(),
  card_last_four: z.string().nullable(),
  pause: z.union([Pause, z.null()]).optional(),
  cancelled: z.boolean().optional(),
  trial_ends_at: z.coerce.date().nullable().optional(),
  billing_anchor: z.number(),
  first_subscription_item: SubscriptionItem.nullable(),
  urls: Urls,
  renews_at: z.coerce.date(),
  ends_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  test_mode: z.boolean().optional(),
});

export type TStatus = z.infer<typeof StatusSchema>;
export type TSubscription = z.infer<typeof Subscription>;
