/** Specialty management DTO (Admin specialty) */
export interface AdminSpecialtyDto {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly createdAt: string; // ISO 8601 date-time
}

/** Specialty registration request */
export interface SpecialtyRegistrationRequest {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

/** Specialty features DTO */
export interface SpecialtyFeatures {
  readonly code: string;
  readonly features: string[];
  readonly capabilities: Record<string, boolean>;
}
