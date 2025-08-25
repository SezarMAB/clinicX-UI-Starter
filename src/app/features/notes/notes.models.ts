import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Note summary DTO */
export interface NoteSummaryDto {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly title: string;
  readonly content: string;
  readonly noteType: string;
  readonly authorId: string; // Staff ID
  readonly authorName?: string;
  readonly isPrivate: boolean;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Request to create a new note */
export interface NoteCreateRequest {
  readonly patientId: string; // UUID
  readonly title: string;
  readonly content: string;
  readonly noteType: string;
  readonly isPrivate?: boolean;
}

/** Request to update an existing note */
export interface NoteUpdateRequest {
  readonly title?: string;
  readonly content?: string;
  readonly noteType?: string;
  readonly isPrivate?: boolean;
}
