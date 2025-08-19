import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import {
  AppointmentCardDto,
  AppointmentCreateRequest,
  PageAppointmentCardDto,
  UpcomingAppointmentDto,
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
    return this.apiService.apiGetResource<AppointmentCardDto>(
      computed(() => `/api/v1/appointments/${appointmentId()}`)
    );
  }

  /**
   * Get all appointments for a patient (paginated)
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientAppointments(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageAppointmentCardDto>(
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
    return this.apiService.apiGetResource<UpcomingAppointmentDto[]>(
      computed(() => `/api/v1/appointments/patient/${patientId()}/upcoming`)
    );
  }

  /**
   * Get appointments for a specific date
   * @param date Signal containing the date (YYYY-MM-DD format)
   */
  getAppointmentsForDate(date: Signal<string>) {
    return this.apiService.apiGetResource<AppointmentCardDto[]>(
      computed(() => `/api/v1/appointments/date/${date()}`)
    );
  }

  /**
   * Get appointments by date range
   * @param startDateTime Signal containing start date-time (ISO format)
   * @param endDateTime Signal containing end date-time (ISO format)
   */
  getAppointmentsByDateRange(startDateTime: Signal<string>, endDateTime: Signal<string>) {
    return this.apiService.apiGetResource<AppointmentCardDto[]>('/api/v1/appointments/date-range', {
      params: computed(() => ({
        startDateTime: startDateTime(),
        endDateTime: endDateTime(),
      })),
    });
  }

  /**
   * Get today's appointments based on user role
   * DOCTOR: Returns only their own appointments
   * NURSE/ASSISTANT/ADMIN: Returns all appointments for today
   */
  getTodayAppointments() {
    return this.apiService.apiGetResource<AppointmentCardDto[]>('/api/v1/appointments/today');
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new appointment
   * @param request Appointment creation data
   * @returns Observable of the created appointment
   */
  createAppointment(request: AppointmentCreateRequest): Observable<AppointmentCardDto> {
    return this.apiService.post<AppointmentCardDto>('/api/v1/appointments', request);
  }
}
