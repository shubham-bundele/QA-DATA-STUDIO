/**
 * Schema detection engine. Parses different input formats (JSON Schema,
 * raw JSON, CSV headers, SQL CREATE TABLE) into a unified ParsedSchema.
 * All parsing is dependency-free (no external libraries).
 */

import { normalize } from "@/core/engines/string-utils";
import type {
  InputFormat,
  ParsedSchema,
  FieldDescriptor,
  FieldConstraints,
  SemanticType,
} from "@/core/engines/types";

/**
 * Infer a primitive data type string from a JavaScript value.
 */
function inferTypeFromValue(value: unknown): string {
  if (value === null || value === undefined) return "string";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "float";
  }
  if (typeof value === "string") {
    // Check for date-like strings
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return "datetime";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
    // Check for email-like
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "string";
    // Check for URL-like
    if (/^https?:\/\//i.test(value)) return "string";
    // Check for UUID-like
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
      )
    )
      return "string";
    // Check for numeric string
    if (/^-?\d+$/.test(value)) return "integer";
    if (/^-?\d+\.\d+$/.test(value)) return "float";
    return "string";
  }
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "string";
}

/**
 * Map a SQL column type string to a simplified data type.
 */
function mapSqlType(sqlType: string): string {
  const upper = sqlType.toUpperCase().trim();

  if (/^(INT|INTEGER|SMALLINT|TINYINT|MEDIUMINT|BIGINT|SERIAL|BIGSERIAL)/.test(upper)) {
    return "integer";
  }
  if (/^(FLOAT|DOUBLE|REAL|DECIMAL|NUMERIC|DEC|MONEY|SMALLMONEY)/.test(upper)) {
    return "float";
  }
  if (/^(BOOL|BOOLEAN|BIT)/.test(upper)) {
    return "boolean";
  }
  if (/^(DATE)$/.test(upper)) {
    return "date";
  }
  if (/^(DATETIME|DATETIME2|SMALLDATETIME)/.test(upper)) {
    return "datetime";
  }
  if (/^(TIMESTAMP|TIMESTAMPTZ)/.test(upper)) {
    return "timestamp";
  }
  if (/^(TIME|TIMETZ)/.test(upper)) {
    return "string";
  }
  if (/^(VARCHAR|CHAR|NVARCHAR|NCHAR|CHARACTER|TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT|CLOB|CITEXT)/.test(upper)) {
    return "string";
  }
  if (/^(BLOB|BYTEA|BINARY|VARBINARY|IMAGE)/.test(upper)) {
    return "string";
  }
  if (/^(JSON|JSONB|XML)/.test(upper)) {
    return "string";
  }
  if (/^(UUID|UNIQUEIDENTIFIER)/.test(upper)) {
    return "string";
  }
  if (/^(ENUM|SET)/.test(upper)) {
    return "string";
  }

  return "string";
}

/**
 * Extract max length from SQL type like VARCHAR(255).
 */
function extractLength(sqlType: string): number | undefined {
  const match = sqlType.match(/\((\d+)\)/);
  if (match) return parseInt(match[1], 10);
  return undefined;
}

/**
 * Extract precision/scale from SQL type like DECIMAL(10,2).
 */
function extractPrecision(sqlType: string): {
  precision?: number;
  scale?: number;
} {
  const match = sqlType.match(/\((\d+)\s*,\s*(\d+)\)/);
  if (match) {
    return {
      precision: parseInt(match[1], 10),
      scale: parseInt(match[2], 10),
    };
  }
  return {};
}

/**
 * Create a default FieldDescriptor stub for a given field name and data type.
 */
function createField(
  name: string,
  dataType: string,
  constraints: FieldConstraints = {}
): FieldDescriptor {
  return {
    name: normalize(name),
    originalName: name,
    dataType,
    semanticType: "unknown" as SemanticType,
    confidence: 0,
    constraints,
  };
}

/**
 * SchemaDetector parses different input formats into a unified ParsedSchema.
 */
export class SchemaDetector {
  /**
   * Auto-detect and parse a schema from the given format and content string.
   */
  detect(format: InputFormat, content: string): ParsedSchema {
    switch (format) {
      case "json-schema":
        return this.parseJsonSchema(content);
      case "json":
        return this.parseRawJson(content);
      case "csv":
        return this.parseCsv(content);
      case "sql":
        return this.parseSql(content);
      default:
        return { fields: [], source: format };
    }
  }

  /**
   * Parse a JSON Schema document and extract field descriptors.
   * Handles properties, required array, types, format, enum, min/max,
   * minLength/maxLength, and pattern.
   */
  parseJsonSchema(content: string): ParsedSchema {
    try {
      const schema = JSON.parse(content);
      const fields: FieldDescriptor[] = [];
      const requiredFields: string[] = schema.required ?? [];

      const properties = schema.properties ?? {};

      for (const [propName, propDef] of Object.entries(properties)) {
        const def = propDef as Record<string, unknown>;

        let dataType = "string";
        if (typeof def.type === "string") {
          dataType = def.type;
        } else if (Array.isArray(def.type)) {
          // Handle nullable types like ["string", "null"]
          const nonNull = (def.type as string[]).filter((t) => t !== "null");
          dataType = nonNull[0] ?? "string";
        }

        const constraints: FieldConstraints = {
          required: requiredFields.includes(propName),
          nullable:
            Array.isArray(def.type) &&
            (def.type as string[]).includes("null"),
        };

        if (def.minLength !== undefined)
          constraints.minLength = def.minLength as number;
        if (def.maxLength !== undefined)
          constraints.maxLength = def.maxLength as number;
        if (def.minimum !== undefined) constraints.min = def.minimum as number;
        if (def.maximum !== undefined) constraints.max = def.maximum as number;
        if (def.pattern !== undefined)
          constraints.pattern = def.pattern as string;
        if (def.enum !== undefined) constraints.enum = def.enum as unknown[];
        if (def.format !== undefined)
          constraints.format = def.format as string;
        if (def.default !== undefined) constraints.default = def.default;
        if (def.uniqueItems !== undefined)
          constraints.unique = def.uniqueItems as boolean;

        const field = createField(propName, dataType, constraints);
        fields.push(field);
      }

      return {
        fields,
        source: "json-schema",
        tableName: schema.title,
      };
    } catch {
      return { fields: [], source: "json-schema" };
    }
  }

  /**
   * Parse a raw JSON sample and infer types from the data values.
   * Handles both single objects and arrays of objects.
   */
  parseRawJson(content: string): ParsedSchema {
    try {
      const data = JSON.parse(content);
      const fields: FieldDescriptor[] = [];

      // Normalize to array of objects
      let records: Record<string, unknown>[];
      if (Array.isArray(data)) {
        records = data.filter(
          (item) => item !== null && typeof item === "object"
        );
      } else if (typeof data === "object" && data !== null) {
        records = [data];
      } else {
        return { fields: [], source: "json" };
      }

      if (records.length === 0) {
        return { fields: [], source: "json" };
      }

      // Collect all unique field names across all records
      const fieldNames = new Set<string>();
      for (const record of records) {
        for (const key of Object.keys(record)) {
          fieldNames.add(key);
        }
      }

      for (const fieldName of fieldNames) {
        // Gather sample values for this field
        const samples: unknown[] = [];
        const types = new Set<string>();

        for (const record of records) {
          if (fieldName in record) {
            const val = record[fieldName];
            samples.push(val);
            types.add(inferTypeFromValue(val));
          }
        }

        // Pick the most common non-null type
        let dataType = "string";
        if (types.size === 1) {
          dataType = [...types][0];
        } else if (types.size > 1) {
          // Prefer non-string types if mixed
          const nonString = [...types].filter((t) => t !== "string");
          dataType = nonString.length > 0 ? nonString[0] : "string";
        }

        const field = createField(fieldName, dataType, {});
        field.samples = samples.slice(0, 10);
        fields.push(field);
      }

      return { fields, source: "json" };
    } catch {
      return { fields: [], source: "json" };
    }
  }

  /**
   * Parse CSV content: use the first line as headers, analyze sample rows
   * to infer field types.
   */
  parseCsv(content: string): ParsedSchema {
    try {
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        return { fields: [], source: "csv" };
      }

      const headers = this.parseCsvLine(lines[0]);
      const dataLines = lines.slice(1);
      const fields: FieldDescriptor[] = [];

      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const headerName = headers[colIdx].trim();
        if (!headerName) continue;

        const samples: unknown[] = [];
        const types = new Set<string>();

        for (
          let rowIdx = 0;
          rowIdx < Math.min(dataLines.length, 20);
          rowIdx++
        ) {
          const row = this.parseCsvLine(dataLines[rowIdx]);
          if (colIdx < row.length) {
            const val = row[colIdx].trim();
            samples.push(val);

            if (val === "") {
              continue;
            }
            if (val.toLowerCase() === "true" || val.toLowerCase() === "false") {
              types.add("boolean");
            } else if (/^-?\d+$/.test(val)) {
              types.add("integer");
            } else if (/^-?\d+\.\d+$/.test(val)) {
              types.add("float");
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              types.add("date");
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
              types.add("datetime");
            } else {
              types.add("string");
            }
          }
        }

        let dataType = "string";
        if (types.size === 1) {
          dataType = [...types][0];
        } else if (types.has("float") && types.has("integer")) {
          dataType = "float";
        }

        const field = createField(headerName, dataType, {});
        field.samples = samples.slice(0, 10);
        fields.push(field);
      }

      return { fields, source: "csv" };
    } catch {
      return { fields: [], source: "csv" };
    }
  }

  /**
   * Parse a SQL CREATE TABLE statement using regex.
   * Handles VARCHAR(n), INT, BIGINT, DECIMAL, TEXT, BOOLEAN, DATE, TIMESTAMP.
   * Extracts NOT NULL, DEFAULT, PRIMARY KEY, UNIQUE, REFERENCES constraints.
   */
  parseSql(content: string): ParsedSchema {
    try {
      const fields: FieldDescriptor[] = [];

      // Match CREATE TABLE statements
      const tableMatch = content.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*)\)\s*;?/i
      );

      if (!tableMatch) {
        return { fields: [], source: "sql" };
      }

      const tableName = tableMatch[1];
      const columnsBlock = tableMatch[2];

      // Split on commas that are not inside parentheses
      const columnDefs = this.splitSqlColumns(columnsBlock);

      // Collect table-level PRIMARY KEY / UNIQUE constraints
      const tablePrimaryKeys = new Set<string>();
      const tableUniqueKeys = new Set<string>();

      for (const colDef of columnDefs) {
        const trimmed = colDef.trim();

        // Table-level PRIMARY KEY constraint
        const pkMatch = trimmed.match(
          /^\s*(?:CONSTRAINT\s+\w+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
        );
        if (pkMatch) {
          const cols = pkMatch[1].split(",").map((c) =>
            c.trim().replace(/[`"']/g, "")
          );
          cols.forEach((c) => tablePrimaryKeys.add(c.toLowerCase()));
          continue;
        }

        // Table-level UNIQUE constraint
        const uqMatch = trimmed.match(
          /^\s*(?:CONSTRAINT\s+\w+\s+)?UNIQUE\s*\(([^)]+)\)/i
        );
        if (uqMatch) {
          const cols = uqMatch[1].split(",").map((c) =>
            c.trim().replace(/[`"']/g, "")
          );
          cols.forEach((c) => tableUniqueKeys.add(c.toLowerCase()));
          continue;
        }

        // Table-level FOREIGN KEY constraint (skip, handled inline)
        if (/^\s*(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY/i.test(trimmed)) {
          continue;
        }

        // Table-level INDEX or KEY (skip)
        if (/^\s*(INDEX|KEY)\s+/i.test(trimmed)) {
          continue;
        }

        // Parse column definition
        const colMatch = trimmed.match(
          /^\s*[`"']?(\w+)[`"']?\s+([A-Za-z]+(?:\s*\([^)]*\))?)/i
        );
        if (!colMatch) continue;

        const colName = colMatch[1];
        const rawType = colMatch[2];
        const dataType = mapSqlType(rawType);

        const constraints: FieldConstraints = {};

        // NOT NULL
        if (/NOT\s+NULL/i.test(trimmed)) {
          constraints.required = true;
          constraints.nullable = false;
        } else {
          constraints.nullable = true;
        }

        // PRIMARY KEY (inline)
        if (/PRIMARY\s+KEY/i.test(trimmed)) {
          constraints.required = true;
          constraints.unique = true;
          constraints.nullable = false;
        }

        // UNIQUE (inline)
        if (/\bUNIQUE\b/i.test(trimmed) && !/PRIMARY\s+KEY/i.test(trimmed)) {
          constraints.unique = true;
        }

        // DEFAULT
        const defaultMatch = trimmed.match(
          /DEFAULT\s+(?:'([^']*)'|(\S+))/i
        );
        if (defaultMatch) {
          constraints.default = defaultMatch[1] ?? defaultMatch[2];
        }

        // REFERENCES (foreign key)
        const refMatch = trimmed.match(
          /REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i
        );

        // Extract maxLength from VARCHAR(n), CHAR(n)
        const lengthVal = extractLength(rawType);
        if (lengthVal !== undefined && dataType === "string") {
          constraints.maxLength = lengthVal;
        }

        // Extract precision from DECIMAL(p,s)
        const { precision, scale } = extractPrecision(rawType);
        if (precision !== undefined && dataType === "float") {
          constraints.max =
            Math.pow(10, precision - (scale ?? 0)) - 1;
        }

        const field = createField(colName, dataType, constraints);

        // Mark foreign keys by the presence of REFERENCES
        if (refMatch) {
          field.semanticType = "foreign_key";
          field.confidence = 0.8;
        }

        fields.push(field);
      }

      // Apply table-level constraints to fields
      for (const field of fields) {
        const lowerName = field.originalName.toLowerCase();
        if (tablePrimaryKeys.has(lowerName)) {
          field.constraints.required = true;
          field.constraints.unique = true;
          field.constraints.nullable = false;
        }
        if (tableUniqueKeys.has(lowerName)) {
          field.constraints.unique = true;
        }
      }

      return { fields, source: "sql", tableName };
    } catch {
      return { fields: [], source: "sql" };
    }
  }

  /**
   * Split CSV line handling quoted fields.
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Split SQL column definitions by commas, respecting parenthesized expressions.
   */
  private splitSqlColumns(block: string): string[] {
    const result: string[] = [];
    let current = "";
    let depth = 0;

    for (const char of block) {
      if (char === "(") {
        depth++;
        current += char;
      } else if (char === ")") {
        depth--;
        current += char;
      } else if (char === "," && depth === 0) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      result.push(current);
    }

    return result;
  }
}
