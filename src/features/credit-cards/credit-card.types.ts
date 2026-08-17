import type { GenerationMeta, CreditCardNetwork } from "@/core/types/common";

export interface CreditCardFields {
  cardNumber: boolean;
  cardHolder: boolean;
  expiryDate: boolean;
  cvv: boolean;
  network: boolean;
  issuer: boolean;
}

export interface CreditCardOptions {
  expiryRange: { minMonths: number; maxMonths: number };
  expired: boolean;
  formatted: boolean;
  seed?: number;
}

export interface CreditCardGenerateConfig {
  count: number;
  networks: CreditCardNetwork[];
  fields: CreditCardFields;
  options: CreditCardOptions;
}

export interface CreditCardRecord {
  id: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  network?: string;
  issuer?: string;
}

export interface CreditCardGenerateResult {
  records: CreditCardRecord[];
  meta: GenerationMeta & { networks: CreditCardNetwork[] };
}
