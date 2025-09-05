import { Nullable } from '@core';
import { PageResponse } from '@core';

/** Gender enum */
export type Gender = '' | 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

/** Patient summary DTO */
export interface PatientSummaryDto {
  readonly id: string; // UUID
  readonly publicFacingId: string;
  readonly fullName: string;
  readonly dateOfBirth: string; // ISO 8601 date
  readonly age: number;
  readonly gender: Nullable<Gender>;
  readonly phoneNumber: Nullable<string>;
  readonly email: Nullable<string>;
  readonly address: Nullable<string>;
  readonly insuranceProvider: Nullable<string>;
  readonly insuranceNumber: Nullable<string>;
  readonly importantMedicalNotes: Nullable<string>;
  readonly balance: number;
  readonly hasAlert: boolean;
}

/** Request to create a new patient */
export interface PatientCreateRequest {
  readonly fullName: string;
  readonly dateOfBirth: string; // ISO 8601 date
  readonly gender?: Gender;
  readonly phoneNumber?: string;
  readonly email?: string;
  readonly address?: string;
  readonly insuranceProvider?: string;
  readonly insuranceNumber?: string;
  readonly importantMedicalNotes?: string;
}

/** Request to update an existing patient */
export interface PatientUpdateRequest {
  readonly fullName: string;
  readonly dateOfBirth: string; // ISO 8601 date
  readonly gender?: Gender;
  readonly phoneNumber?: string;
  readonly email?: string;
  readonly address?: string;
  readonly insuranceProvider?: string;
  readonly insuranceNumber?: string;
  readonly importantMedicalNotes?: string;
}

/** Patient search criteria */
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
  gender?: Gender;
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
  /** Filter patients who had visits */
  hasVisits?: boolean;
  /** Filter by city or address */
  address?: string;
  /** Filter patients with negative balance */
  isBalanceNegative?: boolean;
}

/** Paginated patient response */
export type PagePatientSummaryDto = PageResponse<PatientSummaryDto>;

/** Patient treatment history item */
export interface PatientTreatmentHistoryDto {
  readonly visitId: string; // UUID
  readonly visitDate: string; // ISO 8601 date-time
  readonly procedureName: string;
  readonly dentistName: string;
  readonly totalCost: number;
  readonly status: string;
  readonly notes: Nullable<string>;
}

/** Patient note */
export interface PatientNoteDto {
  readonly noteId: string; // UUID
  readonly authorName: string;
  readonly noteType: string;
  readonly content: string;
  readonly isImportant: boolean;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Patient lab request */
export interface PatientLabRequestDto {
  readonly labRequestId: string; // UUID
  readonly requestDate: string; // ISO 8601 date
  readonly labName: string;
  readonly testType: string;
  readonly status: string;
  readonly results: Nullable<string>;
  readonly resultDate: Nullable<string>; // ISO 8601 date
  readonly notes: Nullable<string>;
}

/** Patient financial record */
export interface PatientFinancialRecordDto {
  readonly recordId: string; // UUID
  readonly type: 'PAYMENT' | 'CHARGE' | 'ADJUSTMENT' | 'INSURANCE';
  readonly amount: number;
  readonly date: string; // ISO 8601 date
  readonly description: string;
  readonly balance: number;
  readonly paymentMethod: Nullable<string>;
  readonly invoiceNumber: Nullable<string>;
}

/** Patient document */
export interface PatientDocumentDto {
  readonly documentId: string; // UUID
  readonly fileName: string;
  readonly fileType: string;
  readonly fileSize: number;
  readonly uploadDate: string; // ISO 8601 date-time
  readonly uploadedBy: string;
  readonly category: string;
  readonly description: Nullable<string>;
  readonly isConfidential: boolean;
}
