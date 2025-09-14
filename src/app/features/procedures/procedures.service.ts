import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  ProcedureResponse,
  ProcedureCreateRequest,
  ProcedureSearchCriteria,
  PageProcedureResponse,
  ProcedureStatus,
} from './procedures.models';

/**
 * Service for managing procedures within visits
 * Procedures are managed as part of visits, not as standalone entities
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class ProceduresService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get all procedures for a visit with pagination
   * @param visitId Signal containing the visit ID
   * @param pageRequest Signal containing pagination parameters
   */
  getVisitProcedures(visitId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageProcedureResponse>(
      computed(() => `/api/v1/visits/${visitId()}/procedures`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get procedure by ID within a visit
   * @param visitId Signal containing the visit ID
   * @param procedureId Signal containing the procedure ID
   */
  getProcedureById(visitId: Signal<string>, procedureId: Signal<string>) {
    return this.apiService.apiGetResource<ProcedureResponse>(
      computed(() => `/api/v1/visits/${visitId()}/procedures/${procedureId()}`)
    );
  }

  /**
   * Get all procedures for a patient across all visits with pagination
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientProcedures(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageProcedureResponse>(
      computed(() => `/api/v1/patients/${patientId()}/procedures`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Add procedure to visit
   * @param visitId The visit ID
   * @param request Procedure create request
   * @returns Observable of the created procedure
   */
  addProcedureToVisit(
    visitId: string,
    request: ProcedureCreateRequest
  ): Observable<ProcedureResponse> {
    return this.apiService.post<ProcedureResponse>(`/api/v1/visits/${visitId}/procedures`, request);
  }

  /**
   * Update procedure
   * @param visitId The visit ID
   * @param procedureId The procedure ID
   * @param request Procedure update request
   * @returns Observable of the updated procedure
   */
  updateProcedure(
    visitId: string,
    procedureId: string,
    request: ProcedureCreateRequest
  ): Observable<ProcedureResponse> {
    return this.apiService.put<ProcedureResponse>(
      `/api/v1/visits/${visitId}/procedures/${procedureId}`,
      request
    );
  }

  /**
   * Delete procedure from visit
   * @param visitId The visit ID
   * @param procedureId The procedure ID
   * @returns Observable that completes when procedure is deleted
   */
  deleteProcedure(visitId: string, procedureId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/visits/${visitId}/procedures/${procedureId}`);
  }

  /**
   * Update procedure status
   * @param visitId The visit ID
   * @param procedureId The procedure ID
   * @param status New status
   * @returns Observable of the updated procedure
   */
  updateProcedureStatus(
    visitId: string,
    procedureId: string,
    status: ProcedureStatus
  ): Observable<ProcedureResponse> {
    return this.apiService.patch<ProcedureResponse>(
      `/api/v1/visits/${visitId}/procedures/${procedureId}/status`,
      null,
      { status } as Record<string, unknown>
    );
  }

  /**
   * Advanced procedure search
   * @param criteria Search criteria
   * @param pageRequest Pagination parameters
   * @returns Observable of search results
   */
  searchProcedures(
    criteria: ProcedureSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PageProcedureResponse> {
    return this.apiService.post<PageProcedureResponse>(
      '/api/v1/procedures/search',
      criteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }
}
