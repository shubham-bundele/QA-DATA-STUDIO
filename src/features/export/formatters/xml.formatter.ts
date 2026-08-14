import type { IFormatter } from "./formatter.interface";
import type { ExportOptions } from "../export.types";

export class XmlFormatter implements IFormatter {
  mimeType = "application/xml";
  fileExtension = ".xml";
  encoding = "utf-8" as const;

  format(data: Record<string, unknown>[], options: Partial<ExportOptions>): string {
    const rootElement = options.rootElement ?? "data";
    const recordElement = options.recordElement ?? "record";
    const prettyPrint = options.prettyPrint !== false;
    const indent = prettyPrint ? "  " : "";
    const newline = prettyPrint ? "\n" : "";

    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    lines.push(`<${rootElement}>`);

    for (const record of data) {
      lines.push(`${indent}<${recordElement}>`);
      for (const [key, value] of Object.entries(record)) {
        lines.push(this.valueToXml(key, value, indent + indent, prettyPrint));
      }
      lines.push(`${indent}</${recordElement}>`);
    }

    lines.push(`</${rootElement}>`);
    return lines.join(newline);
  }

  private valueToXml(
    key: string,
    value: unknown,
    indent: string,
    prettyPrint: boolean
  ): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const newline = prettyPrint ? "\n" : "";

    if (value === null || value === undefined) {
      return `${indent}<${safeKey}/>`;
    }

    if (Array.isArray(value)) {
      const items = value
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            const nested = Object.entries(item as Record<string, unknown>)
              .map(([k, v]) => this.valueToXml(k, v, indent + "    ", prettyPrint))
              .join(newline);
            return `${indent}  <item>${newline}${nested}${newline}${indent}  </item>`;
          }
          return `${indent}  <item>${this.escapeXml(String(item))}</item>`;
        })
        .join(newline);
      return `${indent}<${safeKey}>${newline}${items}${newline}${indent}</${safeKey}>`;
    }

    if (typeof value === "object") {
      const nested = Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => this.valueToXml(k, v, indent + "  ", prettyPrint))
        .join(newline);
      return `${indent}<${safeKey}>${newline}${nested}${newline}${indent}</${safeKey}>`;
    }

    return `${indent}<${safeKey}>${this.escapeXml(String(value))}</${safeKey}>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
