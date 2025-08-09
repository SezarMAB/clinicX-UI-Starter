import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import {
  AppointmentDto,
  AppointmentCreateRequest,
  PageAppointmentDto,
} from './appointments.models';

/**
 * Service for managing appointments
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get appointment by ID
   * @param appointmentId Signal containing the appointment ID
   */
  getAppointmentById(appointmentId: Signal<string>) {
    return this.apiService.apiGetResource<AppointmentDto>(
      computed(() => `/api/v1/appointments/${appointmentId()}`)
    );
  }

  /**
   * Get all appointments for a patient
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientAppointments(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageAppointmentDto>(
      computed(() => `/api/v1/appointments/patient/${patientId()}`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get upcoming appointments for a patient
   * @param patientId Signal containing the patient ID
   */
  getUpcomingAppointmentsForPatient(patientId: Signal<string>) {
    return this.apiService.apiGetResource<AppointmentDto[]>(
      computed(() => `/api/v1/appointments/patient/${patientId()}/upcoming`)
    );
  }

  /**
   * Get appointments for a specific date
   * @param date Signal containing the date (YYYY-MM-DD format)
   */
  getAppointmentsForDate(date: Signal<string>) {
    return this.apiService.apiGetResource<AppointmentDto[]>(
      computed(() => `/api/v1/appointments/date/${date()}`)
    );
  }

  /**
   * Get appointments by date range
   * @param startDateTime Signal containing start date-time
   * @param endDateTime Signal containing end date-time
   */
  getAppointmentsByDateRange(startDateTime: Signal<string>, endDateTime: Signal<string>) {
    return this.apiService.apiGetResource<AppointmentDto[]>('/api/v1/appointments/date-range', {
      params: computed(() => ({
        startDateTime: startDateTime(),
        endDateTime: endDateTime(),
      })),
    });
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new appointment
   * @param request Appointment creation data
   * @returns Observable of the created appointment
   */
  createAppointment(request: AppointmentCreateRequest): Observable<AppointmentDto> {
    return this.apiService.post<AppointmentDto>('/api/v1/appointments', request);
  }
}
