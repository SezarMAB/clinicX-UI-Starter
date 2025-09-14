import { computed, inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  VisitLogDto,
  VisitSearchCriteria,
  PageVisitLogDto,
  VisitCreateRequest,
} from './visits.models';

/**
 * Service for managing Visits within Treatments
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 *
 * Maps exactly to VisitControllerImpl endpoints
 */
@Injectable({ providedIn: 'root' })
export class VisitsService {
  private readonly api = inject(ApiService);

  // --- httpResource (GET) Operations ---

  /**
   * List visits for a treatment (paginated)
   * Maps to: GET /api/v1/treatments/{treatmentId}/visits
   */
  getTreatmentVisits(treatmentId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.api.apiGetResource<PageVisitLogDto>(
      computed(() => `/api/v1/treatments/${treatmentId()}/visits`),
      { params: computed(() => pageRequest() as Record<string, unknown>) }
    );
  }

  /**
   * Get a specific visit within a treatment
   * Maps to: GET /api/v1/treatments/{treatmentId}/visits/{visitId}
   */
  getVisitById(treatmentId: Signal<string>, visitId: Signal<string>) {
    return this.api.apiGetResource<VisitLogDto>(
      computed(() => `/api/v1/treatments/${treatmentId()}/visits/${visitId()}`)
    );
  }

  // --- Mutations (Observable) Operations ---

  /**
   * Add a visit to a treatment
   * Maps to: POST /api/v1/treatments/{treatmentId}/visits
   */
  addVisitToTreatment(treatmentId: string, request: VisitCreateRequest): Observable<VisitLogDto> {
    return this.api.post<VisitLogDto>(`/api/v1/treatments/${treatmentId}/visits`, request);
  }

  /**
   * Update a visit in a treatment
   * Maps to: PUT /api/v1/treatments/{treatmentId}/visits/{visitId}
   */
  updateVisit(
    treatmentId: string,
    visitId: string,
    request: VisitCreateRequest
  ): Observable<VisitLogDto> {
    return this.api.put<VisitLogDto>(
      `/api/v1/treatments/${treatmentId}/visits/${visitId}`,
      request
    );
  }

  /**
   * Delete a visit from a treatment
   * Maps to: DELETE /api/v1/treatments/{treatmentId}/visits/{visitId}
   */
  deleteVisit(treatmentId: string, visitId: string): Observable<void> {
    return this.api.delete<void>(`/api/v1/treatments/${treatmentId}/visits/${visitId}`);
  }

  /**
   * Advanced visit search
   * Maps to: POST /api/v1/visits/search
   */
  searchVisits(
    searchCriteria: VisitSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PageVisitLogDto> {
    return this.api.post<PageVisitLogDto>(
      '/api/v1/visits/search',
      searchCriteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }
}
