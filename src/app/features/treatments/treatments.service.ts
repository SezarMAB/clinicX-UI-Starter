import {
  computed,
  inject,
  Injectable,
  signal,
  Signal,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private readonly injector = inject(Injector);
  private readonly http = inject(HttpClient);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get treatment by ID
   * @param visitId Signal containing the treatment ID
   */
  getTreatmentById(visitId: Signal<string>) {
    return runInInjectionContext(this.injector, () =>
      this.apiService.apiGetResource<TreatmentLogDto>(
        computed(() => `/api/v1/treatments/${visitId()}`)
      )
    );
  }

  /**
   * Get patient treatment history
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientTreatmentHistory(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return runInInjectionContext(this.injector, () =>
      this.apiService.apiGetResource<PageTreatmentLogDto>(
        computed(() => `/api/v1/treatments/patient/${patientId()}`),
        {
          params: computed(() => pageRequest() as Record<string, unknown>),
        }
      )
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
   * @param visitId Treatment ID to update
   * @param request Updated treatment data
   * @returns Observable of the updated treatment
   */
  updateTreatment(visitId: string, request: TreatmentCreateRequest): Observable<TreatmentLogDto> {
    return this.apiService.put<TreatmentLogDto>(`/api/v1/treatments/${visitId}`, request);
  }

  /**
   * Delete a treatment
   * @param visitId Treatment ID to delete
   * @returns Observable that completes when treatment is deleted
   */
  deleteTreatment(visitId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/treatments/${visitId}`);
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

  /**
   * Get patient treatment history as Observable
   * Used to avoid reactive context issues when called from effects
   * @param patientId Patient ID
   * @param pageRequest Pagination parameters
   * @returns Observable of treatment history
   */
  getPatientTreatmentHistoryObservable(
    patientId: string,
    pageRequest: PageRequest
  ): Observable<PageTreatmentLogDto> {
    const params = new HttpParams()
      .set('page', (pageRequest.page || 0).toString())
      .set('size', (pageRequest.size || 10).toString())
      .set('sort', pageRequest.sort?.join(',') || 'visitDate,desc');

    return this.http.get<PageTreatmentLogDto>(`/api/v1/treatments/patient/${patientId}`, {
      params,
    });
  }
}
