import { z } from "zod";
import { MAX_RECORDS } from "@/core/constants/limits";
import { DEFAULT_COUNT } from "@/core/constants/defaults";

export const addressFieldsSchema = z.object({
  street: z.boolean().default(true),
  city: z.boolean().default(true),
  state: z.boolean().default(true),
  zipCode: z.boolean().default(true),
  country: z.boolean().default(true),
  county: z.boolean().default(false),
  latitude: z.boolean().default(false),
  longitude: z.boolean().default(false),
  fullAddress: z.boolean().default(false),
});

export const addressOptionsSchema = z.object({
  stateFilter: z.array(z.string().min(1).max(50)).max(50).default([]),
  seed: z.number().int().optional(),
});

export const addressGenerateSchema = z.object({
  count: z.number().int().min(1).max(MAX_RECORDS).default(DEFAULT_COUNT),
  country: z.string().default("US"),
  fields: addressFieldsSchema.default({}),
  options: addressOptionsSchema.default({}),
});
