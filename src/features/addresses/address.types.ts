import type { GenerationMeta } from "@/core/types/common";

export interface AddressFields {
  street: boolean;
  city: boolean;
  state: boolean;
  zipCode: boolean;
  country: boolean;
  county: boolean;
  latitude: boolean;
  longitude: boolean;
  fullAddress: boolean;
}

export interface AddressOptions {
  stateFilter: string[];
  seed?: number;
}

export interface AddressGenerateConfig {
  count: number;
  country: string;
  fields: AddressFields;
  options: AddressOptions;
}

export interface AddressRecord {
  id: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

export interface AddressGenerateResult {
  records: AddressRecord[];
  meta: GenerationMeta & { country: string };
}
