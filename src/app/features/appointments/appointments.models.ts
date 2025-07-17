/**
 * Appointment-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Appointment status enum
 * @enum AppointmentStatus
 */
export enum AppointmentStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * Request to create a new appointment
 * @interface AppointmentCreateRequest
 */
export interface AppointmentCreateRequest {
  /** Specialty ID */
  specialtyId: string;
  /** Patient ID */
  patientId: string;
  /** Doctor ID */
  doctorId?: string;
  /** Appointment date and time */
  appointmentDatetime: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Appointment status */
  status?: AppointmentStatus;
  /** Additional notes */
  notes?: string;
  /** Staff member who created the appointment */
  createdById?: string;
}

/**
 * Appointment card display DTO
 * @interface AppointmentCardDto
 */
export interface AppointmentCardDto {
  /** Appointment ID */
  appointmentId: string;
  /** Patient ID */
  patientId: string;
  /** Patient full name */
  patientFullName: string;
  /** Patient public ID */
  patientPublicId: string;
  /** Start time */
  startTime: string;
  /** End time */
  endTime: string;
  /** Appointment type */
  appointmentType: string;
  /** Practitioner tag */
  practitionerTag: string;
  /** Patient phone number */
  patientPhoneNumber: string;
  /** Patient gender */
  patientGender: string;
  /** Is patient active */
  isActive: boolean;
  /** Has financial alert */
  hasFinancialAlert: boolean;
  /** Appointment status */
  status: AppointmentStatus;
}

/**
 * Upcoming appointment summary DTO
 * @interface UpcomingAppointmentDto
 */
export interface UpcomingAppointmentDto {
  /** Appointment ID */
  appointmentId: string;
  /** Appointment date and time */
  appointmentDateTime: string;
  /** Specialty */
  specialty: string;
  /** Treatment type */
  treatmentType: string;
  /** Doctor name */
  doctorName: string;
  /** Appointment status */
  status: AppointmentStatus;
  /** Duration in minutes */
  durationMinutes: number;
}
