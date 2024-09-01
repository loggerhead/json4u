import { z } from "zod";

// https://docs.lemonsqueezy.com/api/subscription-items
export const SubscriptionItem = z.object({
  subscription_id: z.number(),
  price_id: z.number(),
  quantity: z.number(),
  is_usage_based: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
