import { z } from "zod";
import { MAX_PAYLOAD_RECORDS, MAX_PAYLOAD_FIELDS, MAX_NESTED_DEPTH } from "@/core/constants/limits";
import { DEFAULT_COUNT } from "@/core/constants/defaults";

const payloadFieldTypes = z.enum([
  "string", "number", "integer", "boolean", "date", "datetime",
  "email", "phone", "url", "uuid", "ip", "name", "address",
  "paragraph", "enum", "object", "array",
]);

const fieldOptionsSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().min(0).max(10000).optional(),
  maxLength: z.number().int().min(0).max(10000).optional(),
  pattern: z.string().max(500).optional(),
  enum: z.array(z.string().max(200)).max(100).optional(),
  nullable: z.boolean().optional(),
  nested: z.lazy(() => z.array(fieldDefinitionSchema).max(MAX_PAYLOAD_FIELDS)).optional(),
}).optional();

const fieldDefinitionSchema: z.ZodType = z.object({
  fieldName: z.string().min(1).max(100),
  fieldType: payloadFieldTypes,
  options: fieldOptionsSchema,
});

export const payloadOptionsSchema = z.object({
  includeNulls: z.boolean().default(false),
  includeEdgeCases: z.boolean().default(false),
  seed: z.number().int().optional(),
});

export const payloadGenerateSchema = z.object({
  count: z.number().int().min(1).max(MAX_PAYLOAD_RECORDS).default(DEFAULT_COUNT),
  format: z.enum(["json", "xml"]).default("json"),
  rootElement: z.string().min(1).max(100).default("data"),
  schema: z.array(fieldDefinitionSchema).min(1).max(MAX_PAYLOAD_FIELDS),
  options: payloadOptionsSchema.default({}),
});
