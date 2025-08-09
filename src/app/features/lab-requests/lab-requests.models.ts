import { PageResponse } from '../../core/models/pagination.model';

/** Lab request DTO */
export interface LabRequestDto {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly requestType: string;
  readonly description: string;
  readonly status: string;
  readonly requestDate: string; // ISO 8601 date-time
  readonly expectedDate?: string; // ISO 8601 date
  readonly completedDate?: string; // ISO 8601 date-time
  readonly notes?: string;
  readonly createdBy: string; // Staff ID
}

/** Lab request create request */
export interface LabRequestCreateRequest {
  readonly patientId: string; // UUID
  readonly requestType: string;
  readonly description: string;
  readonly expectedDate?: string; // ISO 8601 date
  readonly notes?: string;
}

/** Paginated lab request response */
export type PageLabRequestDto = PageResponse<LabRequestDto>;
