import type { IFormatter } from "./formatter.interface";
import type { ExportOptions } from "../export.types";

export class JsonFormatter implements IFormatter {
  mimeType = "application/json";
  fileExtension = ".json";
  encoding = "utf-8" as const;

  format(data: Record<string, unknown>[], options: Partial<ExportOptions>): string {
    const indent = options.prettyPrint !== false ? (options.indent ?? 2) : undefined;
    return JSON.stringify(data, null, indent);
  }
}
