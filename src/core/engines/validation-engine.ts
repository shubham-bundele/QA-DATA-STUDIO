/**
 * Validation engine. Validates generated data against field constraints
 * and format rules to ensure data quality.
 */

import type { FieldDescriptor } from "@/core/engines/types";

/** Result of validating a single value */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Result of validating an entire record */
export interface RecordValidationResult {
  valid: boolean;
  errors: Array<{ field: string; errors: string[] }>;
}

/** Format validators for common data types */
const FORMAT_VALIDATORS: Record<string, (value: string) => boolean> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),

  date: (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(v);
    return !isNaN(d.getTime());
  },

  "date-time": (v) => {
    if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v)) return false;
    const d = new Date(v);
    return !isNaN(d.getTime());
  },

  url: (v) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },

  uri: (v) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },

  uuid: (v) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),

  ipv4: (v) =>
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(v),

  ipv6: (v) =>
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/.test(v),

  hostname: (v) =>
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v),
};

/**
 * ValidationEngine validates generated values against field constraints.
 */
export class ValidationEngine {
  /**
   * Validate a single value against a field's constraints.
   */
  validate(value: unknown, field: FieldDescriptor): ValidationResult {
    const errors: string[] = [];

    // Required check
    if (field.constraints.required) {
      if (value === null || value === undefined) {
        errors.push(`Field "${field.originalName}" is required but got ${value}`);
      }
    }

    // Nullable check
    if (field.constraints.nullable === false && value === null) {
      errors.push(`Field "${field.originalName}" is not nullable`);
    }

    // If null/undefined and not required, skip further checks
    if (value === null || value === undefined) {
      return { valid: errors.length === 0, errors };
    }

    // Type check
    errors.push(...this.checkType(value, field));

    // String-specific checks
    if (typeof value === "string") {
      errors.push(...this.checkStringConstraints(value, field));
    }

    // Numeric checks
    if (typeof value === "number") {
      errors.push(...this.checkNumericConstraints(value, field));
    }

    // Enum check
    if (
      field.constraints.enum &&
      field.constraints.enum.length > 0
    ) {
      const enumValues = field.constraints.enum;
      const found = enumValues.some((e) => {
        if (typeof e === "object" && e !== null) {
          return JSON.stringify(e) === JSON.stringify(value);
        }
        return e === value;
      });
      if (!found) {
        errors.push(
          `Field "${field.originalName}" value "${String(value)}" is not in enum [${enumValues.map(String).join(", ")}]`
        );
      }
    }

    // Format validation
    if (field.constraints.format && typeof value === "string") {
      errors.push(...this.checkFormat(value, field.constraints.format, field.originalName));
    }

    // Pattern validation
    if (field.constraints.pattern && typeof value === "string") {
      try {
        const regex = new RegExp(field.constraints.pattern);
        if (!regex.test(value)) {
          errors.push(
            `Field "${field.originalName}" value does not match pattern "${field.constraints.pattern}"`
          );
        }
      } catch {
        // Invalid regex pattern in constraint, skip
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate an entire record (object of field-name to value) against
   * an array of field descriptors.
   */
  validateRecord(
    record: Record<string, unknown>,
    fields: FieldDescriptor[]
  ): RecordValidationResult {
    const allErrors: Array<{ field: string; errors: string[] }> = [];
    let allValid = true;

    for (const field of fields) {
      const value = record[field.originalName] ?? record[field.name];
      const result = this.validate(value, field);

      if (!result.valid) {
        allValid = false;
        allErrors.push({ field: field.originalName, errors: result.errors });
      }
    }

    return { valid: allValid, errors: allErrors };
  }

  /**
   * Check type compatibility between value and field data type.
   */
  private checkType(value: unknown, field: FieldDescriptor): string[] {
    const errors: string[] = [];
    const dt = field.dataType.toLowerCase();
    const vType = typeof value;

    switch (dt) {
      case "string":
      case "text":
      case "varchar":
      case "char":
        if (vType !== "string") {
          errors.push(
            `Field "${field.originalName}" expected string but got ${vType}`
          );
        }
        break;

      case "integer":
      case "int":
      case "bigint":
      case "smallint":
        if (vType !== "number" || !Number.isInteger(value as number)) {
          errors.push(
            `Field "${field.originalName}" expected integer but got ${vType}${vType === "number" && !Number.isInteger(value as number) ? " (non-integer)" : ""}`
          );
        }
        break;

      case "float":
      case "double":
      case "decimal":
      case "numeric":
      case "real":
      case "number":
        if (vType !== "number") {
          errors.push(
            `Field "${field.originalName}" expected number but got ${vType}`
          );
        }
        break;

      case "boolean":
      case "bool":
        if (vType !== "boolean") {
          errors.push(
            `Field "${field.originalName}" expected boolean but got ${vType}`
          );
        }
        break;

      case "date":
      case "datetime":
      case "timestamp":
        if (vType !== "string" && !(value instanceof Date)) {
          errors.push(
            `Field "${field.originalName}" expected date string but got ${vType}`
          );
        }
        break;
    }

    return errors;
  }

  /**
   * Check string constraints: minLength, maxLength.
   */
  private checkStringConstraints(
    value: string,
    field: FieldDescriptor
  ): string[] {
    const errors: string[] = [];

    if (
      field.constraints.minLength !== undefined &&
      value.length < field.constraints.minLength
    ) {
      errors.push(
        `Field "${field.originalName}" length ${value.length} is below minLength ${field.constraints.minLength}`
      );
    }

    if (
      field.constraints.maxLength !== undefined &&
      value.length > field.constraints.maxLength
    ) {
      errors.push(
        `Field "${field.originalName}" length ${value.length} exceeds maxLength ${field.constraints.maxLength}`
      );
    }

    return errors;
  }

  /**
   * Check numeric constraints: min, max.
   */
  private checkNumericConstraints(
    value: number,
    field: FieldDescriptor
  ): string[] {
    const errors: string[] = [];

    if (field.constraints.min !== undefined && value < field.constraints.min) {
      errors.push(
        `Field "${field.originalName}" value ${value} is below minimum ${field.constraints.min}`
      );
    }

    if (field.constraints.max !== undefined && value > field.constraints.max) {
      errors.push(
        `Field "${field.originalName}" value ${value} exceeds maximum ${field.constraints.max}`
      );
    }

    return errors;
  }

  /**
   * Validate a string value against a named format.
   */
  private checkFormat(
    value: string,
    format: string,
    fieldName: string
  ): string[] {
    const errors: string[] = [];
    const validator = FORMAT_VALIDATORS[format.toLowerCase()];

    if (validator && !validator(value)) {
      errors.push(
        `Field "${fieldName}" value "${value.slice(0, 50)}" does not match format "${format}"`
      );
    }

    return errors;
  }
}
