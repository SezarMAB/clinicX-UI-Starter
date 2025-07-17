/**
 * Note-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Note creation request
 * @interface NoteCreateRequest
 */
export interface NoteCreateRequest {
  /** Patient ID */
  patientId: string;
  /** Note content (max 2000 chars) */
  content: string;
  /** Note type (max 100 chars) */
  noteType?: string;
}

/**
 * Note update request
 * @interface NoteUpdateRequest
 */
export interface NoteUpdateRequest {
  /** Note content (max 2000 chars) */
  content: string;
  /** Note type (max 100 chars) */
  noteType?: string;
}

/**
 * Note summary DTO
 * @interface NoteSummaryDto
 */
export interface NoteSummaryDto {
  /** Note ID */
  noteId: string;
  /** Note content */
  content: string;
  /** Created by staff member name */
  createdByStaffName?: string;
  /** Note date */
  noteDate: string;
  /** Creation timestamp */
  createdAt: string;
}
