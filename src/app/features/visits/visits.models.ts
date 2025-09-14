import { PageResponse, Nullable } from '@core';

/** Aligns with backend TreatmentStatus enum */
export type TreatmentStatus = 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** Visit log DTO (used in visit listings) */
export interface VisitLogDto {
  readonly visitId: string; // UUID
  readonly visitDate: string; // yyyy-MM-dd
  readonly visitTime: Nullable<string>; // HH:mm
  readonly visitType: Nullable<string>;
  readonly toothNumber: Nullable<number>;
  readonly visitName: Nullable<string>;
  readonly doctorName: Nullable<string>;
  readonly durationMinutes: Nullable<number>;
  readonly cost: number;
  readonly status: TreatmentStatus;
  readonly notes: Nullable<string>;
  readonly nextAppointment: Nullable<string>; // yyyy-MM-dd
}

/** Visit search criteria (advanced search) */
export interface VisitSearchCriteria {
  patientId?: string; // UUID
  doctorId?: string; // UUID
  procedureId?: string; // UUID
  statuses?: TreatmentStatus[];
  toothNumber?: number;
  toothNumbers?: number[];
  visitDateFrom?: string; // yyyy-MM-dd
  visitDateTo?: string; // yyyy-MM-dd
  costFrom?: number;
  costTo?: number;
  notesContain?: string;
  procedureName?: string;
  doctorName?: string;
  patientName?: string;
  hasMaterials?: boolean;
  createdFrom?: string; // yyyy-MM-dd
  createdTo?: string; // yyyy-MM-dd
}

/**
 * Visit create/update request - matches backend VisitCreateRequest exactly
 * Visit date and time are now derived from the associated appointment
 */
export interface VisitCreateRequest {
  readonly toothNumber?: number;
  readonly procedureCode?: string;
  readonly procedureName?: string;
  readonly materialUsed?: string;
  readonly quantity?: number;
  readonly cost: number; // BigDecimal
  readonly status: TreatmentStatus;
  readonly doctorId: string; // UUID
  readonly assistantName?: string;
  readonly sessionNumber?: string;
  readonly durationMinutes?: number;
  readonly visitNotes?: string;
  readonly postVisitInstructions?: string;
  readonly appointmentId?: string; // UUID - required to derive date/time
}

export type PageVisitLogDto = PageResponse<VisitLogDto>;
