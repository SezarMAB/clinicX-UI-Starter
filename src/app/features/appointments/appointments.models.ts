import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Appointment status enum */
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

/**
 * Used in the appointments sidebar panel showing daily appointment list.
 * Maps to AppointmentCardDto in backend
 */
export interface AppointmentCardDto {
  readonly appointmentId: string; // UUID
  readonly patientId: string; // UUID
  readonly patientFullName: string;
  readonly patientPublicId: string;
  readonly startTime: string; // LocalTime (HH:mm:ss)
  readonly endTime: string; // LocalTime (HH:mm:ss)
  readonly appointmentType: string;
  readonly practitionerTag: string;
  readonly patientPhoneNumber: string;
  readonly patientGender: string;
  readonly isActive: boolean;
  readonly hasFinancialAlert: boolean;
  readonly status: AppointmentStatus;
}

/**
 * Request to create a new appointment
 * Maps to AppointmentCreateRequest in backend
 */
export interface AppointmentCreateRequest {
  readonly specialtyId: string; // UUID
  readonly patientId: string; // UUID
  readonly doctorId?: string; // UUID (optional)
  readonly appointmentDatetime: string; // ISO 8601 date-time (e.g., 2024-07-15T10:30:00Z)
  readonly durationMinutes: number; // Must be positive
  readonly status?: AppointmentStatus;
  readonly notes?: string;
  readonly createdById?: string; // UUID (optional)
}

/**
 * Used in the upcoming appointments info card on patient overview.
 * Maps to UpcomingAppointmentDto in backend
 */
export interface UpcomingAppointmentDto {
  readonly appointmentId: string; // UUID
  readonly appointmentDateTime: string; // ISO 8601 date-time
  readonly specialty: string;
  readonly treatmentType: string;
  readonly doctorName: string;
  readonly status: AppointmentStatus;
  readonly durationMinutes: number;
}

/** Paginated appointment card response */
export type PageAppointmentCardDto = PageResponse<AppointmentCardDto>;
