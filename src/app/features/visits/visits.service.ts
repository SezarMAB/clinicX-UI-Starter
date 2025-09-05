import {
  computed,
  inject,
  Injectable,
  Signal,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  VisitLogDto,
  VisitCreateRequest,
  VisitSearchCriteria,
  PageVisitLogDto,
} from './visits.models';

/**
 * Service for managing visits
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class VisitsService {
  private readonly apiService = inject(ApiService);
  private readonly injector = inject(Injector);
  private readonly http = inject(HttpClient);
  private readonly visitUrl = `/api/v1/visits`;

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get visit by ID
   * @param visitId Signal containing the visit ID
   */
  getVisitById(visitId: Signal<string>) {
    return runInInjectionContext(this.injector, () =>
      this.apiService.apiGetResource<VisitLogDto>(
        computed(() => {
          return `${this.visitUrl}/${visitId()}`;
        })
      )
    );
  }

  /**
   * Get patient visit history
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientVisitHistory(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return runInInjectionContext(this.injector, () =>
      this.apiService.apiGetResource<PageVisitLogDto>(
        computed(() => `${this.visitUrl}/patient/${patientId()}`),
        {
          params: computed(() => pageRequest() as Record<string, unknown>),
        }
      )
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new visit
   * @param request visit creation data
   * @param patientId Patient ID for the visit
   * @returns Observable of the created visit
   */
  createVisit(request: VisitCreateRequest, patientId?: string): Observable<VisitLogDto> {
    const params = patientId ? { patientId } : undefined;
    return this.apiService.post<VisitLogDto>(this.visitUrl, request, params);
  }

  /**
   * Update an existing visit
   * @param visitId Visit ID to update
   * @param request Updated visit data
   * @returns Observable of the updated visit
   */
  updateVisit(visitId: string, request: VisitCreateRequest): Observable<VisitLogDto> {
    return this.apiService.put<VisitLogDto>(`${this.visitUrl}/${visitId}`, request);
  }

  /**
   * Delete a visit
   * @param visitId visit ID to delete
   * @returns Observable that completes when visit is deleted
   */
  deleteVisit(visitId: string): Observable<void> {
    return this.apiService.delete<void>(`${this.visitUrl}/${visitId}`);
  }

  /**
   * Advanced search for visits
   * @param searchCriteria Search criteria
   * @param pageRequest Pagination parameters
   * @returns Observable of search results
   */
  searchVisits(
    searchCriteria: VisitSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PageVisitLogDto> {
    return this.apiService.post<PageVisitLogDto>(
      `${this.visitUrl}/search`,
      searchCriteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }

  /**
   * Get patient visit history as Observable
   * Used to avoid reactive context issues when called from effects
   * @param patientId Patient ID
   * @param pageRequest Pagination parameters
   * @returns Observable of visit history
   */
  getPatientVisitHistoryObservable(
    patientId: string,
    pageRequest: PageRequest
  ): Observable<PageVisitLogDto> {
    const params = new HttpParams()
      .set('page', (pageRequest.page || 0).toString())
      .set('size', (pageRequest.size || 10).toString())
      .set('sort', pageRequest.sort?.join(',') || 'visitDate,desc');

    return this.http.get<PageVisitLogDto>(`${this.visitUrl}/patient/${patientId}`, {
      params,
    });
  }
}
