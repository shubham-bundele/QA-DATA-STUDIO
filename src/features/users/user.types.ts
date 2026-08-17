import type { GenerationMeta } from "@/core/types/common";

export interface UserFields {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  phone: boolean;
  dateOfBirth: boolean;
  age: boolean;
  gender: boolean;
  username: boolean;
  password: boolean;
  avatar: boolean;
  ssn: boolean;
}

export interface UserOptions {
  ageRange: { min: number; max: number };
  emailDomains: string[];
  passwordLength: number;
  seed?: number;
}

export interface UserGenerateConfig {
  count: number;
  locale: string;
  fields: UserFields;
  options: UserOptions;
}

export interface UserRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  username?: string;
  password?: string;
  avatar?: string;
  ssn?: string;
}

export interface UserGenerateResult {
  records: UserRecord[];
  meta: GenerationMeta & { locale: string };
}
