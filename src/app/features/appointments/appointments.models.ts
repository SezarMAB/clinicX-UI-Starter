import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Appointment DTO */
export interface AppointmentDto {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly staffId: string; // UUID
  readonly appointmentType: string;
  readonly title: string;
  readonly description?: string;
  readonly startDateTime: string; // ISO 8601 date-time
  readonly endDateTime: string; // ISO 8601 date-time
  readonly status: string;
  readonly notes?: string;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
  readonly patientName?: string;
  readonly staffName?: string;
}

/** Request to create a new appointment */
export interface AppointmentCreateRequest {
  readonly patientId: string; // UUID
  readonly staffId: string; // UUID
  readonly appointmentType: string;
  readonly title: string;
  readonly description?: string;
  readonly startDateTime: string; // ISO 8601 date-time
  readonly endDateTime: string; // ISO 8601 date-time
  readonly notes?: string;
}

/** Paginated appointment response */
export type PageAppointmentDto = PageResponse<AppointmentDto>;
