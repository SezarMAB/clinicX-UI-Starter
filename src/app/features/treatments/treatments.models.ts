import { PageResponse } from '@core';

/** Treatment status enum matching backend */
export enum TreatmentStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Treatment log DTO - matches Java TreatmentLogDto
 * This is the new structure matching the backend exactly
 */
export interface TreatmentLogDto {
  // New field names from Java backend
  readonly visitId: string; // UUID
  readonly visitDate: string; // LocalDate - format: YYYY-MM-DD
  readonly visitTime: string; // LocalTime - format: HH:mm:ss
  readonly visitType: string;
  readonly toothNumber?: number; // Integer, optional
  readonly visitName: string;
  readonly doctorName: string;
  readonly durationMinutes?: number; // Integer, optional
  readonly cost: number; // BigDecimal
  readonly status: TreatmentStatus | string;
  readonly notes?: string; // Optional
  readonly nextAppointment?: string; // LocalDate - format: YYYY-MM-DD, optional

  // Legacy field names for backward compatibility
  // These will be removed once all components are updated
  readonly id?: string; // Maps to visitId
  readonly patientId?: string; // Not in new structure but kept for compatibility
  readonly treatmentType?: string; // Maps to visitName
  readonly description?: string; // Maps to notes or visitName
  readonly performedBy?: string; // Maps to doctorName
  readonly duration?: number; // Maps to durationMinutes
  readonly createdAt?: string; // Not in new structure
  readonly updatedAt?: string; // Not in new structure
}

/** Request to create a new treatment */
export interface TreatmentCreateRequest {
  readonly patientId: string; // UUID
  readonly treatmentType: string;
  readonly description: string;
  readonly notes?: string;
  readonly visitDate: string; // ISO 8601 date-time
  readonly duration?: number; // in minutes
  readonly cost?: number;
  readonly performedBy: string; // Staff ID
}

/** Treatment search criteria */
export interface TreatmentSearchCriteria {
  readonly patientId?: string; // UUID
  readonly treatmentType?: string;
  readonly status?: string;
  readonly performedBy?: string; // Staff ID
  readonly dateFrom?: string; // ISO 8601 date
  readonly dateTo?: string; // ISO 8601 date
  readonly costFrom?: number;
  readonly costTo?: number;
}

/** Paginated treatment response */
export type PageTreatmentLogDto = PageResponse<TreatmentLogDto>;
