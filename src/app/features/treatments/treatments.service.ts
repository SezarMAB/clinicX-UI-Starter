import { computed, inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  TreatmentCreateRequest,
  TreatmentResponse,
  PageTreatmentResponse,
} from './treatments.models';

/**
 * Service for managing treatments with nested visits and procedures
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get treatment by ID with all its visits and procedures
   * @param treatmentId Signal containing the treatment ID
   */
  getTreatmentById(treatmentId: Signal<string>) {
    return this.apiService.apiGetResource<TreatmentResponse>(
      computed(() => `/api/treatments/${treatmentId()}`)
    );
  }

  /**
   * List treatments for a patient with pagination
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  listTreatmentsByPatient(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageTreatmentResponse>('/api/treatments', {
      params: computed(() => ({
        ...pageRequest(),
        patientId: patientId(),
      })),
    });
  }

  // --- POST/PUT/DELETE Operations (Observables) ---

  /**
   * Create a new treatment with nested visits and procedures
   * @param request Treatment creation data
   * @returns Observable of the created treatment
   */
  createTreatment(request: TreatmentCreateRequest): Observable<TreatmentResponse> {
    return this.apiService.post<TreatmentResponse>('/api/treatments', request);
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
  ): Observable<TreatmentResponse> {
    return this.apiService.put<TreatmentResponse>(`/api/treatments/${treatmentId}`, request);
  }

  /**
   * Delete a treatment and all its associated data
   * @param treatmentId Treatment ID to delete
   * @returns Observable that completes when treatment is deleted
   */
  deleteTreatment(treatmentId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/treatments/${treatmentId}`);
  }
}
