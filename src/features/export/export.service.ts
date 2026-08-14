import type { ExportFormat } from "@/core/types/common";
import type { ExportConfig, ExportResult } from "./export.types";
import type { IFormatter } from "./formatters/formatter.interface";
import { JsonFormatter } from "./formatters/json.formatter";
import { CsvFormatter } from "./formatters/csv.formatter";
import { XmlFormatter } from "./formatters/xml.formatter";
import { SqlFormatter } from "./formatters/sql.formatter";

const formatters: Record<string, IFormatter> = {
  json: new JsonFormatter(),
  csv: new CsvFormatter(),
  xml: new XmlFormatter(),
  sql: new SqlFormatter(),
};

function generateFilename(format: ExportFormat, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "_");
  return `export_${date}${extension}`;
}

export function exportData(config: ExportConfig): ExportResult {
  const formatter = formatters[config.format];

  if (!formatter) {
    throw new Error(`Unsupported export format: ${config.format}`);
  }

  const output = formatter.format(config.data, config.options);

  return {
    output,
    format: config.format,
    encoding: formatter.encoding,
    filename: generateFilename(config.format, formatter.fileExtension),
    mimeType: formatter.mimeType,
    byteSize: formatter.encoding === "base64"
      ? Math.ceil((output.length * 3) / 4)
      : new Blob([output]).size,
  };
}

export function triggerDownload(result: ExportResult): void {
  let blob: Blob;

  if (result.encoding === "base64") {
    const binaryString = atob(result.output);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    blob = new Blob([bytes], { type: result.mimeType });
  } else {
    blob = new Blob([result.output], { type: result.mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
