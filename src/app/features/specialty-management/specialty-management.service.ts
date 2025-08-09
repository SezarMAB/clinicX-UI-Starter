import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  AdminSpecialtyDto,
  SpecialtyRegistrationRequest,
  SpecialtyFeatures,
} from './specialty-management.models';

/**
 * Service for specialty management (Admin endpoints)
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class SpecialtyManagementService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get all specialties (admin view)
   */
  getAllSpecialties() {
    return this.apiService.apiGetResource<AdminSpecialtyDto[]>('/api/admin/specialties');
  }

  /**
   * Get specialty by code
   * @param code Signal containing the specialty code
   */
  getSpecialtyByCode(code: Signal<string>) {
    return this.apiService.apiGetResource<AdminSpecialtyDto>(
      computed(() => `/api/admin/specialties/${code()}`)
    );
  }

  /**
   * Get specialty features
   * @param code Signal containing the specialty code
   */
  getSpecialtyFeatures(code: Signal<string>) {
    return this.apiService.apiGetResource<SpecialtyFeatures>(
      computed(() => `/api/admin/specialties/${code()}/features`)
    );
  }

  // --- POST/DELETE Operations (Observables) ---

  /**
   * Register new specialty
   * @param request Specialty registration data
   * @returns Observable of registration result
   */
  registerSpecialty(request: SpecialtyRegistrationRequest): Observable<AdminSpecialtyDto> {
    return this.apiService.post<AdminSpecialtyDto>('/api/admin/specialties', request);
  }

  /**
   * Deactivate specialty
   * @param code Specialty code
   * @returns Observable of deactivation result
   */
  deactivateSpecialty(code: string): Observable<AdminSpecialtyDto> {
    return this.apiService.delete<AdminSpecialtyDto>(`/api/admin/specialties/${code}`);
  }
}
