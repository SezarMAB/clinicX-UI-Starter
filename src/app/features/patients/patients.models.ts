/**
 * Patient-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Patient creation request
 * @interface PatientCreateRequest
 */
export interface PatientCreateRequest {
  /** Patient full name (max 150 chars) */
  fullName: string;
  /** Date of birth */
  dateOfBirth: string;
  /** Gender (max 10 chars) */
  gender?: string;
  /** Phone number (max 30 chars) */
  phoneNumber?: string;
  /** Email address (max 100 chars) */
  email?: string;
  /** Address */
  address?: string;
  /** Insurance provider (max 100 chars) */
  insuranceProvider?: string;
  /** Insurance number (max 50 chars) */
  insuranceNumber?: string;
  /** Important medical notes */
  importantMedicalNotes?: string;
}

/**
 * Patient update request
 * @interface PatientUpdateRequest
 */
export interface PatientUpdateRequest {
  /** Patient full name (max 150 chars) */
  fullName: string;
  /** Date of birth */
  dateOfBirth: string;
  /** Gender (max 10 chars) */
  gender?: string;
  /** Phone number (max 30 chars) */
  phoneNumber?: string;
  /** Email address (max 100 chars) */
  email?: string;
  /** Address */
  address?: string;
  /** Insurance provider (max 100 chars) */
  insuranceProvider?: string;
  /** Insurance number (max 50 chars) */
  insuranceNumber?: string;
  /** Important medical notes */
  importantMedicalNotes?: string;
}

/**
 * Patient summary DTO
 * @interface PatientSummaryDto
 */
export interface PatientSummaryDto {
  /** Patient ID */
  id: string;
  /** Public facing ID */
  publicFacingId: string;
  /** Full name */
  fullName: string;
  /** Date of birth */
  dateOfBirth: string;
  /** Age */
  age: number;
  /** Gender */
  gender?: string;
  /** Phone number */
  phoneNumber?: string;
  /** Email */
  email?: string;
  /** Address */
  address?: string;
  /** Insurance provider */
  insuranceProvider?: string;
  /** Insurance number */
  insuranceNumber?: string;
  /** Important medical notes */
  importantMedicalNotes?: string;
  /** Account balance */
  balance: number;
  /** Has alert flag */
  hasAlert: boolean;
}

/**
 * Advanced search criteria for patients
 * @interface PatientSearchCriteria
 */
export interface PatientSearchCriteria {
  /** General search term (name, ID, phone, email) */
  searchTerm?: string;
  /** Filter by patient name */
  name?: string;
  /** Filter by public facing ID */
  publicFacingId?: string;
  /** Filter by phone number */
  phoneNumber?: string;
  /** Filter by email address */
  email?: string;
  /** Filter by gender */
  gender?: string;
  /** Filter by insurance provider */
  insuranceProvider?: string;
  /** Filter by insurance number */
  insuranceNumber?: string;
  /** Filter by birth date from (inclusive) */
  dateOfBirthFrom?: string;
  /** Filter by birth date to (inclusive) */
  dateOfBirthTo?: string;
  /** Minimum age */
  ageFrom?: number;
  /** Maximum age */
  ageTo?: number;
  /** Minimum balance */
  balanceFrom?: number;
  /** Maximum balance */
  balanceTo?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter patients with medical notes */
  hasMedicalNotes?: boolean;
  /** Filter patients with outstanding balance */
  hasOutstandingBalance?: boolean;
  /** Filter by creation date from */
  createdFrom?: string;
  /** Filter by creation date to */
  createdTo?: string;
  /** Filter patients who had appointments */
  hasAppointments?: boolean;
  /** Filter patients who had treatments */
  hasTreatments?: boolean;
  /** Filter by city or address */
  address?: string;
  /** Filter patients with negative balance */
  isBalanceNegative?: boolean;
}
