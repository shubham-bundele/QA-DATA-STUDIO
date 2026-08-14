import type { GeneratorType } from "@/core/types/common";

export interface Template {
  id: string;
  name: string;
  description: string;
  generatorType: GeneratorType;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
