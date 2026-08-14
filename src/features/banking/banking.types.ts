import type { GenerationMeta, AccountType } from "@/core/types/common";

export interface BankingFields {
  bankName: boolean;
  accountNumber: boolean;
  routingNumber: boolean;
  swiftCode: boolean;
  iban: boolean;
  accountType: boolean;
  balance: boolean;
  currency: boolean;
}

export interface BankingOptions {
  accountTypes: AccountType[];
  balanceRange: { min: number; max: number };
  currency: string;
  country: string;
  seed?: number;
}

export interface BankingGenerateConfig {
  count: number;
  fields: BankingFields;
  options: BankingOptions;
}

export interface BankingRecord {
  id: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  accountType?: string;
  balance?: number;
  currency?: string;
}

export interface BankingGenerateResult {
  records: BankingRecord[];
  meta: GenerationMeta & { currency: string };
}
