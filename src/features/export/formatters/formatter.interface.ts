import type { ExportOptions } from "../export.types";

export interface IFormatter {
  format(data: Record<string, unknown>[], options: Partial<ExportOptions>): string;
  mimeType: string;
  fileExtension: string;
  encoding: "utf-8" | "base64";
}
