import type { GenerationMeta, PayloadFieldType } from "@/core/types/common";

export interface PayloadFieldDefinition {
  fieldName: string;
  fieldType: PayloadFieldType;
  options?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
    nullable?: boolean;
    nested?: PayloadFieldDefinition[];
  };
}

export interface PayloadOptions {
  includeNulls: boolean;
  includeEdgeCases: boolean;
  seed?: number;
}

export interface PayloadGenerateConfig {
  count: number;
  format: "json" | "xml";
  rootElement: string;
  schema: PayloadFieldDefinition[];
  options: PayloadOptions;
}

export interface PayloadGenerateResult {
  records: Record<string, unknown>[];
  rawOutput: string;
  meta: GenerationMeta & { format: string; fieldCount: number };
}
