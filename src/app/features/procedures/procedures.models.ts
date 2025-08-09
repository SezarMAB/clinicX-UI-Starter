import { PageResponse } from '../../core/models/pagination.model';

/** Procedure DTO */
export interface ProcedureDto {
  readonly id: string; // UUID
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly category: string;
  readonly duration?: number; // in minutes
  readonly cost?: number;
  readonly isActive: boolean;
  readonly createdAt: string; // ISO 8601 date-time
}

/** Paginated procedure response */
export type PageProcedureDto = PageResponse<ProcedureDto>;
