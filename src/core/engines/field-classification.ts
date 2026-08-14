/**
 * Field classification engine. Determines the semantic type of each field
 * using weighted scoring across name analysis, type hints, constraints,
 * and sample data.
 *
 * Weights:
 * - Name analysis: 60%
 * - Type hint: 20%
 * - Constraint analysis: 10%
 * - Sample data: 10%
 */

import { PatternMatcher } from "@/core/engines/pattern-matching";
import type {
  FieldDescriptor,
  SemanticType,
  ClassificationScore,
} from "@/core/engines/types";

/** Confidence threshold constants */
const CONFIDENCE_HIGH = 0.7;
const CONFIDENCE_MEDIUM = 0.5;
const CONFIDENCE_LOW = 0.3;

/** Regex validators for sample-based classification */
const SAMPLE_VALIDATORS: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[\d\s\-\(\)\.]{7,20}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/.+/i,
  ip_address:
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/,
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  zipcode: /^\d{5}(-\d{4})?$/,
  mac_address: /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/,
  credit_card_number: /^\d{13,19}$/,
  iban: /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/,
};

/**
 * Validate a value against a semantic type using Luhn algorithm for credit cards.
 */
function luhnCheck(value: string): boolean {
  const cleaned = value.replace(/\s|-/g, "");
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  const digits = cleaned.split("").map(Number).reverse();
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * FieldClassifier determines the semantic type of each field descriptor
 * using a multi-signal weighted scoring system.
 */
export class FieldClassifier {
  private matcher = new PatternMatcher();

  /**
   * Classify a single field: determine its semantic type and confidence.
   */
  classify(field: FieldDescriptor): FieldDescriptor {
    const nameScores = this.matcher.match(field.name, field.dataType);

    // Build candidate scores with all four signals
    const candidates: ClassificationScore[] = [];

    // Start with name-based candidates
    for (const ns of nameScores) {
      const typeScore = this.computeTypeScore(field.dataType, ns.semanticType);
      const constraintScore = this.computeConstraintScore(
        field.constraints,
        ns.semanticType,
        field.name
      );
      const sampleScore = this.computeSampleScore(
        field.samples,
        ns.semanticType
      );

      const totalScore =
        ns.breakdown.nameScore * 0.6 +
        typeScore * 0.2 +
        constraintScore * 0.1 +
        sampleScore * 0.1;

      candidates.push({
        semanticType: ns.semanticType,
        score: totalScore,
        breakdown: {
          nameScore: ns.breakdown.nameScore,
          typeScore,
          constraintScore,
          sampleScore,
        },
      });
    }

    // Also check sample-only classification if no strong name match
    if (field.samples && field.samples.length > 0 && candidates.length === 0) {
      const sampleGuess = this.classifyBySamples(field.samples);
      if (sampleGuess) {
        candidates.push({
          semanticType: sampleGuess,
          score: 0.1,
          breakdown: { nameScore: 0, typeScore: 0, constraintScore: 0, sampleScore: 1 },
        });
      }
    }

    // Also fall back to type-based classification
    if (candidates.length === 0) {
      const typeGuess = this.classifyByType(field.dataType);
      candidates.push({
        semanticType: typeGuess,
        score: 0.2,
        breakdown: { nameScore: 0, typeScore: 1, constraintScore: 0, sampleScore: 0 },
      });
    }

    // Pick best candidate
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    const score = Math.min(best.score, 1);
    const confidenceLevel =
      score >= CONFIDENCE_HIGH ? "high" :
      score >= CONFIDENCE_MEDIUM ? "medium" :
      score >= CONFIDENCE_LOW ? "low" :
      "unknown";

    return {
      ...field,
      semanticType: best.semanticType,
      confidence: score,
      metadata: {
        ...field.metadata,
        confidenceLevel,
      },
    };
  }

  /**
   * Classify all fields in an array.
   */
  classifyAll(fields: FieldDescriptor[]): FieldDescriptor[] {
    return fields.map((f) => this.classify(f));
  }

  /**
   * Compute a type compatibility score.
   */
  private computeTypeScore(
    dataType: string,
    semanticType: SemanticType
  ): number {
    const dt = dataType.toLowerCase();

    // Boolean check
    if (
      (dt === "boolean" || dt === "bool") &&
      semanticType === "boolean"
    )
      return 1;

    // Integer types
    if (
      (dt === "integer" || dt === "int" || dt === "bigint" || dt === "smallint") &&
      ["integer", "id", "foreign_key", "age", "zipcode"].includes(semanticType)
    )
      return 0.7;

    // Float types
    if (
      (dt === "float" || dt === "double" || dt === "decimal" || dt === "numeric") &&
      ["float", "amount", "latitude", "longitude"].includes(semanticType)
    )
      return 0.7;

    // Date types
    if (dt === "date" && ["date", "dob"].includes(semanticType)) return 0.7;
    if (
      (dt === "datetime" || dt === "timestamp") &&
      ["datetime", "timestamp"].includes(semanticType)
    )
      return 0.7;

    // String types holding special data
    if (
      (dt === "string" || dt === "text" || dt === "varchar") &&
      [
        "first_name",
        "last_name",
        "full_name",
        "email",
        "phone",
        "ssn",
        "username",
        "password",
        "street",
        "city",
        "state",
        "country",
        "zipcode",
        "full_address",
        "company",
        "job_title",
        "department",
        "credit_card_number",
        "credit_card_cvv",
        "credit_card_expiry",
        "credit_card_type",
        "iban",
        "swift_code",
        "routing_number",
        "account_number",
        "currency",
        "url",
        "ip_address",
        "uuid",
        "domain",
        "mac_address",
        "gender",
        "string",
        "enum",
      ].includes(semanticType)
    )
      return 0.5;

    return 0;
  }

  /**
   * Analyze constraints to help differentiate semantic types.
   */
  private computeConstraintScore(
    constraints: FieldDescriptor["constraints"],
    semanticType: SemanticType,
    fieldName: string
  ): number {
    let score = 0;

    // ID-like: unique + usually required
    if (semanticType === "id" && constraints.unique && constraints.required) {
      score += 0.5;
    }

    // Enum: if the field has an enum array
    if (
      semanticType === "enum" &&
      constraints.enum &&
      constraints.enum.length > 0
    ) {
      score += 1;
    }

    // Email: maxLength around 254 is common
    if (semanticType === "email" && constraints.maxLength) {
      if (constraints.maxLength >= 200 && constraints.maxLength <= 320) {
        score += 0.3;
      }
    }

    // Phone: maxLength around 15-20
    if (semanticType === "phone" && constraints.maxLength) {
      if (constraints.maxLength >= 10 && constraints.maxLength <= 25) {
        score += 0.3;
      }
    }

    // Zipcode: maxLength around 5-10
    if (semanticType === "zipcode" && constraints.maxLength) {
      if (constraints.maxLength >= 5 && constraints.maxLength <= 10) {
        score += 0.3;
      }
    }

    // SSN: maxLength exactly 11 (###-##-####)
    if (semanticType === "ssn" && constraints.maxLength === 11) {
      score += 0.4;
    }

    // Credit card CVV: maxLength 3-4
    if (semanticType === "credit_card_cvv" && constraints.maxLength) {
      if (constraints.maxLength >= 3 && constraints.maxLength <= 4) {
        score += 0.3;
      }
    }

    // UUID: format hint
    if (
      semanticType === "uuid" &&
      constraints.format === "uuid"
    ) {
      score += 0.5;
    }

    // Pattern-based hints
    if (constraints.pattern) {
      if (
        semanticType === "email" &&
        constraints.pattern.includes("@")
      ) {
        score += 0.4;
      }
    }

    // Format hints from JSON Schema
    if (constraints.format) {
      const fmt = constraints.format.toLowerCase();
      if (fmt === "email" && semanticType === "email") score += 0.5;
      if (fmt === "uri" && semanticType === "url") score += 0.5;
      if (fmt === "date" && semanticType === "date") score += 0.5;
      if (fmt === "date-time" && semanticType === "datetime") score += 0.5;
      if (fmt === "ipv4" && semanticType === "ip_address") score += 0.5;
      if (fmt === "ipv6" && semanticType === "ip_address") score += 0.5;
      if (fmt === "hostname" && semanticType === "domain") score += 0.5;
    }

    return Math.min(score, 1);
  }

  /**
   * Analyze sample values to detect patterns.
   */
  private computeSampleScore(
    samples: unknown[] | undefined,
    semanticType: SemanticType
  ): number {
    if (!samples || samples.length === 0) return 0;

    const stringValues = samples
      .filter((s) => typeof s === "string")
      .map((s) => s as string);

    if (stringValues.length === 0) {
      // For numeric samples, check type compatibility
      const numericValues = samples.filter((s) => typeof s === "number");
      if (numericValues.length > 0) {
        if (semanticType === "integer" || semanticType === "age" || semanticType === "id") {
          const allInts = numericValues.every((v) =>
            Number.isInteger(v as number)
          );
          if (allInts) return 0.5;
        }
        if (
          semanticType === "float" ||
          semanticType === "amount" ||
          semanticType === "latitude" ||
          semanticType === "longitude"
        ) {
          return 0.5;
        }
      }
      if (
        samples.every((s) => typeof s === "boolean") &&
        semanticType === "boolean"
      ) {
        return 0.8;
      }
      return 0;
    }

    // Check regex validators
    const validatorKey = semanticType as string;
    const validator = SAMPLE_VALIDATORS[validatorKey];

    if (validator) {
      const matchCount = stringValues.filter((v) => validator.test(v)).length;
      const matchRatio = matchCount / stringValues.length;
      if (matchRatio > 0.5) return matchRatio;
    }

    // Special: Luhn check for credit card numbers
    if (semanticType === "credit_card_number") {
      const luhnMatches = stringValues.filter((v) => luhnCheck(v)).length;
      if (luhnMatches / stringValues.length > 0.5) return 0.8;
    }

    return 0;
  }

  /**
   * Try to classify from samples alone when name matching yields nothing.
   */
  private classifyBySamples(samples: unknown[]): SemanticType | null {
    const stringValues = samples
      .filter((s) => typeof s === "string")
      .map((s) => s as string);

    if (stringValues.length === 0) return null;

    // Check each validator
    for (const [key, regex] of Object.entries(SAMPLE_VALIDATORS)) {
      const matchCount = stringValues.filter((v) => regex.test(v)).length;
      if (matchCount / stringValues.length > 0.7) {
        return key as SemanticType;
      }
    }

    return null;
  }

  /**
   * Fall back to classifying by data type alone.
   */
  private classifyByType(dataType: string): SemanticType {
    const dt = dataType.toLowerCase();
    switch (dt) {
      case "boolean":
      case "bool":
        return "boolean";
      case "integer":
      case "int":
      case "bigint":
      case "smallint":
        return "integer";
      case "float":
      case "double":
      case "decimal":
      case "numeric":
      case "real":
        return "float";
      case "date":
        return "date";
      case "datetime":
        return "datetime";
      case "timestamp":
      case "timestamptz":
        return "timestamp";
      default:
        return "string";
    }
  }
}
