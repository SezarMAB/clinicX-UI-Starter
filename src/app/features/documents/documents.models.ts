/**
 * Document-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Document summary DTO
 * @interface DocumentSummaryDto
 */
export interface DocumentSummaryDto {
  /** Document ID */
  documentId: string;
  /** File name */
  fileName?: string;
  /** File type */
  fileType?: string;
  /** MIME type */
  mimeType?: string;
  /** Upload date */
  uploadDate?: string;
  /** File size in bytes */
  fileSizeBytes?: number;
  /** Uploaded by staff member name */
  uploadedByStaffName?: string;
}
