/**
 * Treatment-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Treatment status enum
 * @enum TreatmentStatus
 */
export enum TreatmentStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

/**
 * Treatment creation request
 * @interface TreatmentCreateRequest
 */
export interface TreatmentCreateRequest {
  /** Treatment date */
  treatmentDate: string;
  /** Treatment time */
  treatmentTime: string;
  /** Tooth number */
  toothNumber?: number;
  /** Procedure ID */
  procedureId: string;
  /** Material used */
  materialUsed?: string;
  /** Quantity */
  quantity?: number;
  /** Cost */
  cost: number;
  /** Treatment status */
  status: TreatmentStatus;
  /** Doctor ID */
  doctorId: string;
  /** Assistant name */
  assistantName?: string;
  /** Session number */
  sessionNumber?: string;
  /** Duration in minutes */
  durationMinutes?: number;
  /** Treatment notes */
  treatmentNotes?: string;
  /** Post treatment instructions */
  postTreatmentInstructions?: string;
}

/**
 * Treatment log DTO
 * @interface TreatmentLogDto
 */
export interface TreatmentLogDto {
  /** Treatment ID */
  treatmentId: string;
  /** Treatment date */
  treatmentDate: string;
  /** Treatment time */
  treatmentTime: string;
  /** Visit type */
  visitType?: string;
  /** Tooth number */
  toothNumber?: number;
  /** Treatment name */
  treatmentName?: string;
  /** Doctor name */
  doctorName?: string;
  /** Duration in minutes */
  durationMinutes?: number;
  /** Cost */
  cost?: number;
  /** Treatment status */
  status?: TreatmentStatus;
  /** Notes */
  notes?: string;
  /** Next appointment date */
  nextAppointment?: string;
}

/**
 * Advanced search criteria for treatments
 * @interface TreatmentSearchCriteria
 */
export interface TreatmentSearchCriteria {
  /** Filter by patient ID */
  patientId?: string;
  /** Filter by doctor ID */
  doctorId?: string;
  /** Filter by procedure ID */
  procedureId?: string;
  /** Filter by treatment status */
  statuses?: TreatmentStatus[];
  /** Filter by tooth number */
  toothNumber?: number;
  /** Filter by tooth numbers */
  toothNumbers?: number[];
  /** Filter by treatment date from */
  treatmentDateFrom?: string;
  /** Filter by treatment date to */
  treatmentDateTo?: string;
  /** Minimum treatment cost */
  costFrom?: number;
  /** Maximum treatment cost */
  costTo?: number;
  /** Search in treatment notes */
  notesContain?: string;
  /** Filter by procedure name */
  procedureName?: string;
  /** Filter by doctor name */
  doctorName?: string;
  /** Filter by patient name */
  patientName?: string;
  /** Filter treatments with materials used */
  hasMaterials?: boolean;
  /** Filter by creation date from */
  createdFrom?: string;
  /** Filter by creation date to */
  createdTo?: string;
}
