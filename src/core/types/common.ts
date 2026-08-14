export type ExportFormat = "json" | "csv" | "xml" | "sql";

export type GeneratorType =
  | "users"
  | "addresses"
  | "banking"
  | "credit-cards"
  | "payloads";

export type Locale =
  | "en"
  | "en_US"
  | "en_GB"
  | "en_IN"
  | "en_CA"
  | "en_AU"
  | "de"
  | "fr"
  | "ja";

export type CreditCardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners";

export type AccountType = "checking" | "savings" | "business";

export type SqlDialect = "mysql" | "postgres" | "sqlite";

export type PayloadFieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "uuid"
  | "ip"
  | "name"
  | "address"
  | "paragraph"
  | "enum"
  | "object"
  | "array";

export interface GenerationMeta {
  count: number;
  generatedAt: string;
  seed?: number;
}
