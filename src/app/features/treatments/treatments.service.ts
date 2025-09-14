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
 * Service for managing Treatments (with nested visits and procedures)
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly api = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /** Get treatment by ID */
  getTreatmentById(treatmentId: Signal<string>) {
    return this.api.apiGetResource<TreatmentResponse>(
      computed(() => `/api/treatments/${treatmentId()}`)
    );
  }

  /**
   * List treatments for a patient with pagination
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getTreatmentsByPatient(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.api.apiGetResource<PageTreatmentResponse>('/api/treatments', {
      params: computed(() => ({
        ...pageRequest(),
        patientId: patientId(),
      })),
    });
  }

  // --- Mutations (Observables) ---

  /** Create a treatment with nested visits/procedures */
  createTreatment(request: TreatmentCreateRequest): Observable<TreatmentResponse> {
    return this.api.post<TreatmentResponse>('/api/treatments', request);
  }

  /** Update an existing treatment */
  updateTreatment(id: string, request: TreatmentCreateRequest): Observable<TreatmentResponse> {
    return this.api.put<TreatmentResponse>(`/api/treatments/${id}`, request);
  }

  /** Delete treatment */
  deleteTreatment(id: string): Observable<void> {
    return this.api.delete<void>(`/api/treatments/${id}`);
  }
}
