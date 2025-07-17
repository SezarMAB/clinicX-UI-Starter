/**
 * Lab request-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Lab request status enum
 * @enum LabRequestStatus
 */
export enum LabRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

/**
 * Lab request creation request
 * @interface LabRequestCreateRequest
 */
export interface LabRequestCreateRequest {
  /** Patient ID */
  patientId: string;
  /** Request date */
  requestDate: string;
  /** Lab name (max 100 chars) */
  labName: string;
  /** Test type (max 100 chars) */
  testType: string;
  /** Instructions (max 500 chars) */
  instructions?: string;
  /** Expected completion date */
  expectedCompletionDate?: string;
  /** Priority (max 200 chars) */
  priority?: string;
}

/**
 * Lab request DTO
 * @interface LabRequestDto
 */
export interface LabRequestDto {
  /** Lab request ID */
  labRequestId: string;
  /** Order number */
  orderNumber?: string;
  /** Item description */
  itemDescription?: string;
  /** Tooth number */
  toothNumber?: number;
  /** Date sent */
  dateSent?: string;
  /** Date due */
  dateDue?: string;
  /** Request status */
  status?: LabRequestStatus;
  /** Lab name */
  labName?: string;
}
