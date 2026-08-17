import type { IFormatter } from "./formatter.interface";
import type { ExportOptions } from "../export.types";

export class CsvFormatter implements IFormatter {
  mimeType = "text/csv";
  fileExtension = ".csv";
  encoding = "utf-8" as const;

  format(data: Record<string, unknown>[], options: Partial<ExportOptions>): string {
    if (data.length === 0) return "";

    const delimiter = options.delimiter ?? ",";
    const includeHeaders = options.includeHeaders !== false;
    const quoteStrings = options.quoteStrings !== false;

    const allKeys = this.extractKeys(data);

    const lines: string[] = [];

    if (includeHeaders) {
      lines.push(allKeys.map((key) => this.escapeValue(key, delimiter, quoteStrings)).join(delimiter));
    }

    for (const record of data) {
      const values = allKeys.map((key) => {
        const value = this.getNestedValue(record, key);
        return this.escapeValue(this.formatValue(value), delimiter, quoteStrings);
      });
      lines.push(values.join(delimiter));
    }

    return lines.join("\n");
  }

  private extractKeys(data: Record<string, unknown>[]): string[] {
    const keySet = new Set<string>();
    for (const record of data) {
      this.flattenKeys(record, "", keySet);
    }
    return Array.from(keySet);
  }

  private flattenKeys(obj: Record<string, unknown>, prefix: string, keys: Set<string>): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        this.flattenKeys(value as Record<string, unknown>, fullKey, keys);
      } else {
        keys.add(fullKey);
      }
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  private escapeValue(value: string, delimiter: string, quoteStrings: boolean): string {
    const needsQuoting =
      value.includes(delimiter) ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r");

    if (needsQuoting || quoteStrings) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
