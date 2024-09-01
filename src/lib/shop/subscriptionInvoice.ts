import { z } from "zod";

const Urls = z.object({
  invoice_url: z.string().nullable().optional(),
});

// https://docs.lemonsqueezy.com/api/subscription-invoices#the-subscription-invoice-object
export const SubscriptionInvoice = z.object({
  store_id: z.number(),
  subscription_id: z.number(),
  customer_id: z.number(),
  user_name: z.string(),
  user_email: z.string(),
  billing_reason: z.enum(["initial", "renewal", "updated"]),
  card_brand: z.string().nullable(),
  card_last_four: z.string().nullable(),
  currency: z.string(),
  currency_rate: z.coerce.number(),
  status: z.enum(["pending", "paid", "void", "refunded", "partial_refund"]),
  status_formatted: z.string(),
  refunded: z.boolean().optional(),
  refunded_at: z.coerce.date().nullable().optional(),
  subtotal: z.number(),
  discount_total: z.number(),
  tax: z.number(),
  tax_inclusive: z.boolean(),
  total: z.number(),
  refunded_amount: z.number(),
  subtotal_usd: z.number(),
  discount_total_usd: z.number(),
  tax_usd: z.number(),
  total_usd: z.number(),
  refunded_amount_usd: z.number(),
  subtotal_formatted: z.string(),
  discount_total_formatted: z.string(),
  tax_formatted: z.string(),
  total_formatted: z.string(),
  refunded_amount_formatted: z.string(),
  urls: Urls,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  test_mode: z.boolean().optional(),
});

export type TSubscriptionInvoice = z.infer<typeof SubscriptionInvoice>;