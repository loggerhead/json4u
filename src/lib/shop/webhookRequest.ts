import { z } from "zod";
import { CustomData } from "./base";
import { Subscription } from "./subscription";

const Data = z.object({
  id: z.coerce.number(),
  type: z.string(),
  attributes: Subscription,
});

const Meta = z.object({
  event_name: z.enum(["subscription_created", "subscription_updated"]),
  webhook_id: z.string(),
  test_mode: z.boolean(),
  custom_data: CustomData.optional(),
});

export const WebhookRequest = z.object({
  data: Data,
  meta: Meta,
});

export type TWebhookRequest = z.infer<typeof WebhookRequest>;
