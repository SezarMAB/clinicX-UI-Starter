import { PageResponse } from '../../core/models/pagination.model';

/** Document DTO */
export interface DocumentDto {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly fileName: string;
  readonly fileType: string;
  readonly fileSize: number;
  readonly description?: string;
  readonly uploadDate: string; // ISO 8601 date-time
  readonly uploadedBy: string; // Staff ID
  readonly downloadUrl?: string;
}
