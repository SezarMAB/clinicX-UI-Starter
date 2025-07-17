import { Injectable, Signal, computed, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/api';
import { Page, PageableRequest } from '@core/models';
import {
  TreatmentCreateRequest,
  TreatmentLogDto,
  TreatmentSearchCriteria,
} from './treatments.models';

/**
 * Service for managing treatments
 * Operations related to patient treatment management
 * @class TreatmentsService
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly basePath = '/api/v1/treatments';
  private readonly api = inject(ApiService);

  /**
   * Create new treatment
   * Creates a new treatment record for a patient
   * @param patientId Patient UUID
   * @param request Treatment creation request
   * @returns Observable of created treatment
   */
  createTreatment(patientId: string, request: TreatmentCreateRequest): Observable<TreatmentLogDto> {
    const params = this.api.createParams({ patientId });
    return this.api.post<TreatmentLogDto>(this.basePath, request, params);
  }

  /**
   * Get treatment by ID
   * Retrieves a specific treatment by its UUID
   * @param id Treatment UUID
   * @returns Signal-based resource of treatment
   */
  getTreatmentById(id: string | Signal<string>) {
    const path =
      typeof id === 'string'
        ? signal(`${this.basePath}/${id}`)
        : computed(() => `${this.basePath}/${id()}`);

    return this.api.apiGetResource<TreatmentLogDto>(path);
  }

  /**
   * Update treatment
   * Updates an existing treatment record
   * @param id Treatment UUID
   * @param request Treatment update request
   * @returns Observable of updated treatment
   */
  updateTreatment(id: string, request: TreatmentCreateRequest): Observable<TreatmentLogDto> {
    return this.api.put<TreatmentLogDto>(`${this.basePath}/${id}`, request);
  }

  /**
   * Delete treatment
   * Deletes a treatment record by its UUID
   * @param id Treatment UUID
   * @returns Observable of void
   */
  deleteTreatment(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Get patient treatment history
   * Retrieves paginated treatment history for a specific patient
   * @param patientId Patient UUID
   * @param pageable Pagination parameters
   * @returns Observable of paginated treatments
   */
  getPatientTreatmentHistory(
    patientId: string,
    pageable?: PageableRequest
  ): Observable<Page<TreatmentLogDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'treatmentDate',
    });

    return this.api.get<Page<TreatmentLogDto>>(`${this.basePath}/patient/${patientId}`, params);
  }

  /**
   * Get patient treatment history (Signal-based)
   * Retrieves paginated treatment history for a specific patient
   * @param patientId Patient UUID signal
   * @param pageable Pagination parameters signal
   * @returns Signal-based resource of paginated treatments
   */
  getPatientTreatmentHistoryResource(
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
        sort: p.sort ?? 'treatmentDate',
      });
    });

    return this.api.apiGetResource<Page<TreatmentLogDto>>(path, params);
  }

  /**
   * Advanced treatment search
   * Search treatments with multiple criteria and filters
   * @param criteria Search criteria
   * @param pageable Pagination parameters
   * @returns Observable of paginated treatments
   */
  searchTreatments(
    criteria: TreatmentSearchCriteria,
    pageable?: PageableRequest
  ): Observable<Page<TreatmentLogDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'treatmentDate',
    });

    return this.api.post<Page<TreatmentLogDto>>(`${this.basePath}/search`, criteria, params);
  }
}
