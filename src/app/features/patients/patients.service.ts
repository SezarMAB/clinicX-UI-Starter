import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  PatientSummaryDto,
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientSearchCriteria,
  PagePatientSummaryDto,
  PatientTreatmentHistoryDto,
  PatientNoteDto,
  PatientLabRequestDto,
  PatientFinancialRecordDto,
  PatientDocumentDto,
} from './patients.models';

/**
 * Service for managing patients
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get all patients with pagination
   * @param pageRequest Signal containing pagination parameters
   * @param searchTerm Signal containing optional search term
   */
  getAllPatients(
    pageRequest: Signal<PageRequest>,
    searchTerm: Signal<string | undefined> = signal(undefined)
  ) {
    return this.apiService.apiGetResource<PagePatientSummaryDto>('/api/v1/patients', {
      params: computed(() => ({
        ...pageRequest(),
        searchTerm: searchTerm(),
      })),
    });
  }

  /**
   * Get patient by ID
   * @param patientId Signal containing the patient ID
   */
  getPatientById(patientId: Signal<string>) {
    return this.apiService.apiGetResource<PatientSummaryDto>(
      computed(() => `/api/v1/patients/${patientId()}`)
    );
  }

  /**
   * Get patient treatment history
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientTreatmentHistory(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PatientTreatmentHistoryDto[]>(
      computed(() => `/api/v1/patients/${patientId()}/treatments`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get patient notes
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientNotes(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PatientNoteDto[]>(
      computed(() => `/api/v1/patients/${patientId()}/notes`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get patient lab requests
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientLabRequests(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PatientLabRequestDto[]>(
      computed(() => `/api/v1/patients/${patientId()}/lab-requests`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get patient financial records
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientFinancialRecords(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PatientFinancialRecordDto[]>(
      computed(() => `/api/v1/patients/${patientId()}/financial-records`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get patient documents
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientDocuments(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PatientDocumentDto[]>(
      computed(() => `/api/v1/patients/${patientId()}/documents`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new patient
   * @param request Patient creation data
   * @returns Observable of the created patient
   */
  createPatient(request: PatientCreateRequest): Observable<PatientSummaryDto> {
    return this.apiService.post<PatientSummaryDto>('/api/v1/patients', request);
  }

  /**
   * Update an existing patient
   * @param patientId Patient ID to update
   * @param request Updated patient data
   * @returns Observable of the updated patient
   */
  updatePatient(patientId: string, request: PatientUpdateRequest): Observable<PatientSummaryDto> {
    return this.apiService.put<PatientSummaryDto>(`/api/v1/patients/${patientId}`, request);
  }

  /**
   * Delete a patient (soft delete)
   * @param patientId Patient ID to delete
   * @returns Observable that completes when patient is deleted
   */
  deletePatient(patientId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/patients/${patientId}`);
  }

  /**
   * Advanced patient search
   * @param searchCriteria Search criteria
   * @param pageRequest Pagination parameters
   * @returns Observable of search results
   */
  searchPatients(
    searchCriteria: PatientSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PagePatientSummaryDto> {
    return this.apiService.post<PagePatientSummaryDto>(
      '/api/v1/patients/search',
      searchCriteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }
}
