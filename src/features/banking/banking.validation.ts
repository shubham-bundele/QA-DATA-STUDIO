import { z } from "zod";
import { MAX_RECORDS } from "@/core/constants/limits";
import {
  DEFAULT_COUNT,
  DEFAULT_CURRENCY,
  DEFAULT_BALANCE_MIN,
  DEFAULT_BALANCE_MAX,
} from "@/core/constants/defaults";

export const bankingFieldsSchema = z.object({
  bankName: z.boolean().default(true),
  accountNumber: z.boolean().default(true),
  routingNumber: z.boolean().default(true),
  swiftCode: z.boolean().default(false),
  iban: z.boolean().default(false),
  accountType: z.boolean().default(true),
  balance: z.boolean().default(true),
  currency: z.boolean().default(true),
});

export const bankingOptionsSchema = z.object({
  accountTypes: z
    .array(z.enum(["checking", "savings", "business"]))
    .min(1)
    .default(["checking", "savings"]),
  balanceRange: z
    .object({
      min: z.number().min(0).default(DEFAULT_BALANCE_MIN),
      max: z.number().min(0).default(DEFAULT_BALANCE_MAX),
    })
    .default({ min: DEFAULT_BALANCE_MIN, max: DEFAULT_BALANCE_MAX }),
  currency: z.string().default(DEFAULT_CURRENCY),
  country: z.string().default("US"),
  seed: z.number().int().optional(),
});

export const bankingGenerateSchema = z.object({
  count: z.number().int().min(1).max(MAX_RECORDS).default(DEFAULT_COUNT),
  fields: bankingFieldsSchema.default({}),
  options: bankingOptionsSchema.default({}),
});
