import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  TreatmentLogDto,
  TreatmentCreateRequest,
  TreatmentSearchCriteria,
  PageTreatmentLogDto,
} from './treatments.models';

/**
 * Service for managing treatments
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get treatment by ID
   * @param treatmentId Signal containing the treatment ID
   */
  getTreatmentById(treatmentId: Signal<string>) {
    return this.apiService.apiGetResource<TreatmentLogDto>(
      computed(() => `/api/v1/treatments/${treatmentId()}`)
    );
  }

  /**
   * Get patient treatment history
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientTreatmentHistory(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageTreatmentLogDto>(
      computed(() => `/api/v1/treatments/patient/${patientId()}`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new treatment
   * @param request Treatment creation data
   * @param patientId Patient ID for the treatment
   * @returns Observable of the created treatment
   */
  createTreatment(
    request: TreatmentCreateRequest,
    patientId?: string
  ): Observable<TreatmentLogDto> {
    const params = patientId ? { patientId } : undefined;
    return this.apiService.post<TreatmentLogDto>('/api/v1/treatments', request, params);
  }

  /**
   * Update an existing treatment
   * @param treatmentId Treatment ID to update
   * @param request Updated treatment data
   * @returns Observable of the updated treatment
   */
  updateTreatment(
    treatmentId: string,
    request: TreatmentCreateRequest
  ): Observable<TreatmentLogDto> {
    return this.apiService.put<TreatmentLogDto>(`/api/v1/treatments/${treatmentId}`, request);
  }

  /**
   * Delete a treatment
   * @param treatmentId Treatment ID to delete
   * @returns Observable that completes when treatment is deleted
   */
  deleteTreatment(treatmentId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/treatments/${treatmentId}`);
  }

  /**
   * Advanced search for treatments
   * @param searchCriteria Search criteria
   * @param pageRequest Pagination parameters
   * @returns Observable of search results
   */
  searchTreatments(
    searchCriteria: TreatmentSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PageTreatmentLogDto> {
    return this.apiService.post<PageTreatmentLogDto>(
      '/api/v1/treatments/search',
      searchCriteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }
}
