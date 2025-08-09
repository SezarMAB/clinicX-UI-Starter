import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import { ProcedureDto, PageProcedureDto } from './procedures.models';

/**
 * Service for managing procedures
 * Provides reactive queries via httpResource for GET operations
 */
@Injectable({ providedIn: 'root' })
export class ProceduresService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get all procedures with pagination
   * @param pageRequest Signal containing pagination parameters
   */
  getAllProcedures(pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageProcedureDto>('/api/v1/procedures', {
      params: computed(() => pageRequest() as Record<string, unknown>),
    });
  }

  /**
   * Get procedure by ID
   * @param procedureId Signal containing the procedure ID
   */
  getProcedureById(procedureId: Signal<string>) {
    return this.apiService.apiGetResource<ProcedureDto>(
      computed(() => `/api/v1/procedures/${procedureId()}`)
    );
  }

  /**
   * Search procedures by term
   * @param searchTerm Signal containing search term
   */
  searchProcedures(searchTerm: Signal<string | undefined>) {
    return this.apiService.apiGetResource<ProcedureDto[]>('/api/v1/procedures/search', {
      params: computed(() => ({
        searchTerm: searchTerm(),
      })),
    });
  }

  /**
   * Get active procedures
   */
  getActiveProcedures() {
    return this.apiService.apiGetResource<ProcedureDto[]>('/api/v1/procedures/active');
  }
}
