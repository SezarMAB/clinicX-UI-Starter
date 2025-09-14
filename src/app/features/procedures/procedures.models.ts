import { Nullable } from '@core';
import { PageResponse } from '@core';

/**
 * Procedure status enum matching backend
 */
export type ProcedureStatus =
  | 'NOT_PLANNED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'SENT_TO_LAB'
  | 'RECEIVED_FROM_LAB'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Procedure response DTO
 */
export interface ProcedureResponse {
  readonly id: string;
  readonly visitId: string;
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
  readonly status: ProcedureStatus;
  readonly billable: boolean;
  readonly notes: Nullable<string>;
  readonly startedAt: Nullable<string>;
  readonly completedAt: Nullable<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Request to create a new procedure
 */
export interface ProcedureCreateRequest {
  readonly code: string;
  readonly name: string;
  readonly toothNumber?: number;
  readonly surfaces?: string[];
  readonly quantity: number;
  readonly unitFee: number;
  readonly durationMinutes?: number;
  readonly performedByStaffId: string;
  readonly notes?: string;
  readonly billable?: boolean;
}

/**
 * Advanced procedure search criteria
 */
export interface ProcedureSearchCriteria {
  /** Filter by patient ID */
  patientId?: string;
  /** Filter by visit ID */
  visitId?: string;
  /** Filter by treatment ID */
  treatmentId?: string;
  /** Filter by performed by staff ID */
  performedByStaffId?: string;
  /** Filter by procedure statuses */
  statuses?: ProcedureStatus[];
  /** Filter by procedure code */
  code?: string;
  /** Filter by procedure name */
  name?: string;
  /** Filter by tooth number */
  toothNumber?: number;
  /** Filter by tooth numbers */
  toothNumbers?: number[];
  /** Minimum unit fee */
  unitFeeFrom?: number;
  /** Maximum unit fee */
  unitFeeTo?: number;
  /** Filter by billable status */
  billable?: boolean;
  /** Search in procedure notes */
  notesContain?: string;
  /** Filter by staff name */
  staffName?: string;
  /** Filter by patient name */
  patientName?: string;
  /** Filter by creation date from */
  createdFrom?: string;
  /** Filter by creation date to */
  createdTo?: string;
  /** Filter by started date from */
  startedFrom?: string;
  /** Filter by started date to */
  startedTo?: string;
  /** Filter by completed date from */
  completedFrom?: string;
  /** Filter by completed date to */
  completedTo?: string;
}

/** Paginated procedure response */
export type PageProcedureResponse = PageResponse<ProcedureResponse>;
