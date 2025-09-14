import { Nullable, PageResponse } from '@core';

/** Treatment create request */
export interface TreatmentCreateRequest {
  readonly patientId: string; // UUID
  readonly name?: string;
  readonly status?: string;
  readonly startDate?: string; // yyyy-MM-dd
  readonly endDate?: string; // yyyy-MM-dd
  readonly notes?: string;
  readonly visits: VisitCreateRequest[];
}

/** Visit create request (nested under treatment create) */
export interface VisitCreateRequest {
  readonly visitDate: string; // yyyy-MM-dd
  readonly visitTime?: string; // HH:mm
  readonly providerId: string; // UUID
  readonly appointmentId?: string; // UUID
  readonly notes?: string;
  readonly procedures: VisitProcedureCreateRequest[];
}

/** VisitProcedure create request (nested under visit create) */
export interface VisitProcedureCreateRequest {
  readonly code: string;
  readonly name: string;
  readonly toothNumber?: number; // 11..48
  readonly surfaces?: string[];
  readonly quantity: number; // 1..32
  readonly unitFee: number; // decimal(8,2)
  readonly durationMinutes?: number; // 5..480
  readonly performedByStaffId: string; // UUID
  readonly procedureTemplateId?: string; // UUID
  readonly note?: string;
  readonly billable?: boolean;
}

/** VisitProcedure response */
export interface VisitProcedureResponse {
  readonly id: string; // UUID
  readonly code: string;
  readonly name: string;
  readonly toothNumber: Nullable<number>;
  readonly surfaces: string[];
  readonly quantity: number;
  readonly unitFee: number;
  readonly totalFee: number;
  readonly durationMinutes: Nullable<number>;
  readonly performedByStaffId: string; // UUID
  readonly performedByName: Nullable<string>;
  readonly procedureTemplateId: Nullable<string>; // UUID
  readonly status: string;
  readonly billable: boolean;
  readonly note: Nullable<string>;
  readonly startedAt: Nullable<string>; // ISO 8601 instant
  readonly completedAt: Nullable<string>; // ISO 8601 instant
  readonly createdAt: string; // ISO 8601 instant
  readonly updatedAt: string; // ISO 8601 instant
}

/** Visit response (with nested procedures) */
export interface VisitResponse {
  readonly id: string; // UUID
  readonly visitDate: string; // yyyy-MM-dd
  readonly visitTime: Nullable<string>; // HH:mm
  readonly providerId: string; // UUID
  readonly providerName: Nullable<string>;
  readonly appointmentId: Nullable<string>; // UUID
  readonly notes: Nullable<string>;
  readonly procedures: VisitProcedureResponse[];
  readonly totalCost: number;
  readonly overallStatus: string;
  readonly createdAt: string; // ISO 8601 instant
  readonly updatedAt: string; // ISO 8601 instant
}

/** Treatment response (with nested visits and procedures) */
export interface TreatmentResponse {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly patientName: Nullable<string>;
  readonly name: Nullable<string>;
  readonly status: string;
  readonly startDate: Nullable<string>; // yyyy-MM-dd
  readonly endDate: Nullable<string>; // yyyy-MM-dd
  readonly notes: Nullable<string>;
  readonly visits: VisitResponse[];
  readonly createdAt: string; // ISO 8601 instant
  readonly updatedAt: string; // ISO 8601 instant
}

/** Paged treatment response list */
export type PageTreatmentResponse = PageResponse<TreatmentResponse>;
