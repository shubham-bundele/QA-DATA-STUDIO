import { z } from "zod";
import { MAX_RECORDS } from "@/core/constants/limits";
import {
  DEFAULT_LOCALE,
  DEFAULT_COUNT,
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_AGE_MIN,
  DEFAULT_AGE_MAX,
} from "@/core/constants/defaults";

export const userFieldsSchema = z.object({
  firstName: z.boolean().default(true),
  lastName: z.boolean().default(true),
  email: z.boolean().default(true),
  phone: z.boolean().default(true),
  dateOfBirth: z.boolean().default(false),
  age: z.boolean().default(false),
  gender: z.boolean().default(false),
  username: z.boolean().default(false),
  password: z.boolean().default(false),
  avatar: z.boolean().default(false),
  ssn: z.boolean().default(false),
});

export const userOptionsSchema = z.object({
  ageRange: z
    .object({
      min: z.number().int().min(0).max(120).default(DEFAULT_AGE_MIN),
      max: z.number().int().min(0).max(120).default(DEFAULT_AGE_MAX),
    })
    .default({ min: DEFAULT_AGE_MIN, max: DEFAULT_AGE_MAX }),
  emailDomains: z.array(z.string().min(1).max(100)).max(10).default([]),
  passwordLength: z
    .number()
    .int()
    .min(6)
    .max(128)
    .default(DEFAULT_PASSWORD_LENGTH),
  seed: z.number().int().optional(),
});

export const userGenerateSchema = z.object({
  count: z.number().int().min(1).max(MAX_RECORDS).default(DEFAULT_COUNT),
  locale: z.string().default(DEFAULT_LOCALE),
  fields: userFieldsSchema.default({}),
  options: userOptionsSchema.default({}),
});
