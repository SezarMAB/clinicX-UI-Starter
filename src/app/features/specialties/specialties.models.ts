import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Specialty DTO */
export interface SpecialtyDto {
  readonly id: string; // UUID
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Request to create a new specialty */
export interface SpecialtyCreateRequest {
  readonly name: string;
  readonly code: string;
  readonly description?: string;
}

/** Request to update an existing specialty */
export interface SpecialtyUpdateRequest {
  readonly name?: string;
  readonly description?: string;
}

/** Paginated specialty response */
export type PageSpecialtyDto = PageResponse<SpecialtyDto>;
