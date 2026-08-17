import type { GeneratorType } from "@/core/types/common";

export interface HistoryEntry {
  id: string;
  generatorType: GeneratorType;
  config: Record<string, unknown>;
  recordCount: number;
  generatedAt: string;
  preview: Record<string, unknown>[];
  exportedAs?: string;
}
