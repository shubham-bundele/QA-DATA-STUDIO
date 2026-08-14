import type { ExportFormat, SqlDialect } from "@/core/types/common";

export interface ExportOptions {
  delimiter: string;
  includeHeaders: boolean;
  quoteStrings: boolean;
  rootElement: string;
  recordElement: string;
  prettyPrint: boolean;
  tableName: string;
  dialect: SqlDialect;
  includeCreate: boolean;
  includeDropIfExists: boolean;
  indent: number;
}

export interface ExportConfig {
  data: Record<string, unknown>[];
  format: ExportFormat;
  options: Partial<ExportOptions>;
}

export interface ExportResult {
  output: string;
  format: ExportFormat;
  encoding: "utf-8" | "base64";
  filename: string;
  mimeType: string;
  byteSize: number;
}
