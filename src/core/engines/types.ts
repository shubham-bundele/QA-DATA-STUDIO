/**
 * Core type definitions for the QA Intelligence Engine layer.
 * These types define the schema representation, field classification,
 * and relationship model used throughout the engine pipeline.
 */

export type SemanticType =
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "phone"
  | "dob"
  | "age"
  | "gender"
  | "ssn"
  | "username"
  | "password"
  | "street"
  | "city"
  | "state"
  | "country"
  | "zipcode"
  | "full_address"
  | "latitude"
  | "longitude"
  | "company"
  | "job_title"
  | "department"
  | "credit_card_number"
  | "credit_card_cvv"
  | "credit_card_expiry"
  | "credit_card_type"
  | "iban"
  | "swift_code"
  | "routing_number"
  | "account_number"
  | "currency"
  | "amount"
  | "url"
  | "ip_address"
  | "uuid"
  | "domain"
  | "mac_address"
  | "boolean"
  | "integer"
  | "float"
  | "string"
  | "date"
  | "datetime"
  | "timestamp"
  | "enum"
  | "id"
  | "foreign_key"
  | "unknown";

export type DataCategory = "positive" | "negative" | "boundary" | "security";

export type InputFormat = "json-schema" | "json" | "csv" | "sql";

export interface FieldConstraints {
  required?: boolean;
  nullable?: boolean;
  unique?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: unknown[];
  format?: string;
  default?: unknown;
}

export interface FieldDescriptor {
  name: string;
  originalName: string;
  dataType: string;
  semanticType: SemanticType;
  confidence: number;
  constraints: FieldConstraints;
  samples?: unknown[];
  metadata?: Record<string, unknown>;
}

export interface ParsedSchema {
  fields: FieldDescriptor[];
  source: InputFormat;
  tableName?: string;
}

export interface ClassificationScore {
  semanticType: SemanticType;
  score: number;
  breakdown: {
    nameScore: number;
    typeScore: number;
    constraintScore: number;
    sampleScore: number;
  };
}

export interface RelationshipEdge {
  from: string;
  to: string;
  type: "foreign_key" | "co_occurrence" | "conditional" | "derived";
}
