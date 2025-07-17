import { Injectable, Signal, computed, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '@core/api';
import { Page, PageableRequest } from '@core/models';
import {
  AppointmentCardDto,
  AppointmentCreateRequest,
  UpcomingAppointmentDto,
} from './appointments.models';

/**
 * Service for managing appointments
 * Operations related to appointment management
 * @class AppointmentsService
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly basePath = '/api/v1/appointments';
  private readonly api = inject(ApiService);
  constructor() {}

  /**
   * Create new appointment
   * Creates a new appointment in the system
   * @param request Appointment creation request
   * @returns Observable of created appointment
   */
  createAppointment(request: AppointmentCreateRequest): Observable<AppointmentCardDto> {
    return this.api.post<AppointmentCardDto>(this.basePath, request);
  }

  /**
   * Get appointment by ID
   * Retrieves a specific appointment by its UUID
   * @param id Appointment UUID
   * @returns Signal-based resource of appointment
   */
  getAppointmentById(id: string | Signal<string>) {
    const path =
      typeof id === 'string'
        ? signal(`${this.basePath}/${id}`)
        : computed(() => `${this.basePath}/${id()}`);

    return this.api.apiGetResource<AppointmentCardDto>(path);
  }

  /**
   * Get all appointments for patient
   * Retrieves paginated list of all appointments for a specific patient
   * @param patientId Patient UUID
   * @param pageable Pagination parameters
   * @returns Observable of paginated appointments
   */
  getPatientAppointments(
    patientId: string,
    pageable?: PageableRequest
  ): Observable<Page<AppointmentCardDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'appointmentDateTime',
    });

    return this.api.get<Page<AppointmentCardDto>>(`${this.basePath}/patient/${patientId}`, params);
  }

  /**
   * Get all appointments for patient (Signal-based)
   * Retrieves paginated list of all appointments for a specific patient
   * @param patientId Patient UUID signal
   * @param pageable Pagination parameters signal
   * @returns Signal-based resource of paginated appointments
   */
  getPatientAppointmentsResource(
    patientId: string | Signal<string>,
    pageable?: Signal<PageableRequest | undefined>
  ) {
    const path =
      typeof patientId === 'string'
        ? signal(`${this.basePath}/patient/${patientId}`)
        : computed(() => `${this.basePath}/patient/${patientId()}`);

    const params = computed(() => {
      const p = pageable?.();
      if (!p) return undefined;

      return this.api.createParams({
        page: p.page ?? 0,
        size: p.size ?? 20,
        sort: p.sort ?? 'appointmentDateTime',
      });
    });

    return this.api.apiGetResource<Page<AppointmentCardDto>>(path, params);
  }

  /**
   * Get upcoming appointments for patient
   * Retrieves upcoming appointments for a specific patient
   * @param patientId Patient UUID
   * @returns Observable of upcoming appointments
   */
  getUpcomingAppointmentsForPatient(patientId: string): Observable<UpcomingAppointmentDto[]> {
    return this.api.get<UpcomingAppointmentDto[]>(`${this.basePath}/patient/${patientId}/upcoming`);
  }

  /**
   * Get upcoming appointments for patient (Signal-based)
   * Retrieves upcoming appointments for a specific patient
   * @param patientId Patient UUID signal
   * @returns Signal-based resource of upcoming appointments
   */
  getUpcomingAppointmentsForPatientResource(patientId: string | Signal<string>) {
    const path =
      typeof patientId === 'string'
        ? signal(`${this.basePath}/patient/${patientId}/upcoming`)
        : computed(() => `${this.basePath}/patient/${patientId()}/upcoming`);

    return this.api.apiGetResource<UpcomingAppointmentDto[]>(path);
  }

  /**
   * Get appointments for specific date
   * Retrieves all appointments for a specific date (today's appointments)
   * @param date Date in YYYY-MM-DD format
   * @returns Observable of appointments
   */
  getAppointmentsForDate(date: string): Observable<AppointmentCardDto[]> {
    return this.api.get<AppointmentCardDto[]>(`${this.basePath}/date/${date}`);
  }

  /**
   * Get appointments for specific date (Signal-based)
   * Retrieves all appointments for a specific date
   * @param date Date signal in YYYY-MM-DD format
   * @returns Signal-based resource of appointments
   */
  getAppointmentsForDateResource(date: string | Signal<string>) {
    const path =
      typeof date === 'string'
        ? signal(`${this.basePath}/date/${date}`)
        : computed(() => `${this.basePath}/date/${date()}`);

    return this.api.apiGetResource<AppointmentCardDto[]>(path);
  }

  /**
   * Get appointments by date range
   * Retrieves appointments within a specific date/time range for daily view in sidebar
   * @param startDateTime Start date and time (ISO format)
   * @param endDateTime End date and time (ISO format)
   * @returns Observable of appointments
   */
  getAppointmentsByDateRange(
    startDateTime: string,
    endDateTime: string
  ): Observable<AppointmentCardDto[]> {
    const params = this.api.createParams({ startDateTime, endDateTime });
    return this.api.get<AppointmentCardDto[]>(`${this.basePath}/date-range`, params);
  }

  /**
   * Get appointments by date range (Signal-based)
   * Retrieves appointments within a specific date/time range
   * @param startDateTime Start date and time signal
   * @param endDateTime End date and time signal
   * @returns Signal-based resource of appointments
   */
  getAppointmentsByDateRangeResource(
    startDateTime: string | Signal<string>,
    endDateTime: string | Signal<string>
  ) {
    const path = signal(`${this.basePath}/date-range`);
    const params = computed(() => {
      const start = typeof startDateTime === 'string' ? startDateTime : startDateTime();
      const end = typeof endDateTime === 'string' ? endDateTime : endDateTime();
      return this.api.createParams({ startDateTime: start, endDateTime: end });
    });

    return this.api.apiGetResource<AppointmentCardDto[]>(path, params);
  }
}
