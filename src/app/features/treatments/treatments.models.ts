import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Treatment log DTO */
export interface TreatmentLogDto {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly treatmentType: string;
  readonly description: string;
  readonly notes?: string;
  readonly treatmentDate: string; // ISO 8601 date-time
  readonly duration?: number; // in minutes
  readonly cost?: number;
  readonly status: string;
  readonly performedBy: string; // Staff ID
  readonly materials?: string[]; // Material IDs
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Request to create a new treatment */
export interface TreatmentCreateRequest {
  readonly patientId: string; // UUID
  readonly treatmentType: string;
  readonly description: string;
  readonly notes?: string;
  readonly treatmentDate: string; // ISO 8601 date-time
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
