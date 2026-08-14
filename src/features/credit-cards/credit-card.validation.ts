import { z } from "zod";
import { MAX_RECORDS } from "@/core/constants/limits";
import {
  DEFAULT_COUNT,
  DEFAULT_EXPIRY_MIN_MONTHS,
  DEFAULT_EXPIRY_MAX_MONTHS,
} from "@/core/constants/defaults";

export const creditCardFieldsSchema = z.object({
  cardNumber: z.boolean().default(true),
  cardHolder: z.boolean().default(true),
  expiryDate: z.boolean().default(true),
  cvv: z.boolean().default(true),
  network: z.boolean().default(true),
  issuer: z.boolean().default(false),
});

export const creditCardOptionsSchema = z.object({
  expiryRange: z
    .object({
      minMonths: z.number().int().min(1).max(120).default(DEFAULT_EXPIRY_MIN_MONTHS),
      maxMonths: z.number().int().min(1).max(120).default(DEFAULT_EXPIRY_MAX_MONTHS),
    })
    .default({
      minMonths: DEFAULT_EXPIRY_MIN_MONTHS,
      maxMonths: DEFAULT_EXPIRY_MAX_MONTHS,
    }),
  expired: z.boolean().default(false),
  formatted: z.boolean().default(true),
  seed: z.number().int().optional(),
});

export const creditCardGenerateSchema = z.object({
  count: z.number().int().min(1).max(MAX_RECORDS).default(DEFAULT_COUNT),
  networks: z
    .array(z.enum(["visa", "mastercard", "amex", "discover", "diners"]))
    .min(1)
    .default(["visa", "mastercard", "amex"]),
  fields: creditCardFieldsSchema.default({}),
  options: creditCardOptionsSchema.default({}),
});
