import { Nullable, PageResponse } from '@core';

/**
 * Treatment create request DTO
 */
export interface TreatmentCreateRequest {
  /** Patient ID (required) */
  readonly patientId: string;
  /** Treatment name (max 150 chars) */
  readonly name?: string;
  /** Treatment status (max 50 chars) */
  readonly status?: string;
  /** Start date in yyyy-MM-dd format */
  readonly startDate?: string;
  /** End date in yyyy-MM-dd format */
  readonly endDate?: string;
  /** Treatment notes (max 1000 chars) */
  readonly notes?: string;
  /** List of visits (at least one required) */
  readonly visits: VisitCreateRequest[];
}

/**
 * Visit create request DTO (nested under treatment)
 */
export interface VisitCreateRequest {
  /** Visit date in yyyy-MM-dd format (required) */
  readonly visitDate: string;
  /** Visit time in HH:mm format */
  readonly visitTime?: string;
  /** Provider/Staff ID (required) */
  readonly providerId: string;
  /** Associated appointment ID if any */
  readonly appointmentId?: string;
  /** Visit notes (max 1000 chars) */
  readonly notes?: string;
  /** List of procedures (at least one required) */
  readonly procedures: VisitProcedureCreateRequest[];
}

/**
 * Visit procedure create request DTO (nested under visit)
 */
export interface VisitProcedureCreateRequest {
  /** Procedure code (required, max 20 chars) */
  readonly code: string;
  /** Procedure name (required, max 255 chars) */
  readonly name: string;
  /** Tooth number (11-48) */
  readonly toothNumber?: number;
  /** List of tooth surfaces */
  readonly surfaces?: string[];
  /** Quantity (1-32, default: 1) */
  readonly quantity: number;
  /** Unit fee (0.00-999999.99) */
  readonly unitFee: number;
  /** Duration in minutes (5-480) */
  readonly durationMinutes?: number;
  /** ID of staff who performed the procedure (required) */
  readonly performedByStaffId: string;
  /** Procedure template ID if using a template */
  readonly procedureTemplateId?: string;
  /** Procedure notes (max 500 chars) */
  readonly note?: string;
  /** Whether the procedure is billable (default: true) */
  readonly billable?: boolean;
}

/**
 * Visit procedure response DTO
 */
export interface VisitProcedureResponse {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly toothNumber: Nullable<number>;
  readonly surfaces: string[];
  readonly quantity: number;
  readonly unitFee: number;
  readonly totalFee: number;
  readonly durationMinutes: Nullable<number>;
  readonly performedByStaffId: string;
  readonly performedByName: Nullable<string>;
  readonly procedureTemplateId: Nullable<string>;
  readonly status: string;
  readonly billable: boolean;
  readonly note: Nullable<string>;
  readonly startedAt: Nullable<string>;
  readonly completedAt: Nullable<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Visit response DTO (with nested procedures)
 */
export interface VisitResponse {
  readonly id: string;
  readonly visitDate: string;
  readonly visitTime: Nullable<string>;
  readonly providerId: string;
  readonly providerName: Nullable<string>;
  readonly appointmentId: Nullable<string>;
  readonly notes: Nullable<string>;
  readonly procedures: VisitProcedureResponse[];
  readonly totalCost: number;
  readonly overallStatus: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Treatment response DTO (with nested visits and procedures)
 */
export interface TreatmentResponse {
  readonly id: string;
  readonly patientId: string;
  readonly patientName: Nullable<string>;
  readonly name: Nullable<string>;
  readonly status: Nullable<string>;
  readonly startDate: Nullable<string>;
  readonly endDate: Nullable<string>;
  readonly notes: Nullable<string>;
  readonly visits: VisitResponse[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Paginated treatment response */
export type PageTreatmentResponse = PageResponse<TreatmentResponse>;
