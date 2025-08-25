import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  SpecialtyDto,
  SpecialtyCreateRequest,
  SpecialtyUpdateRequest,
  PageSpecialtyDto,
} from './specialties.models';

/**
 * Service for managing specialties
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class SpecialtiesService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get all specialties with pagination
   * @param pageRequest Signal containing pagination parameters
   */
  getAllSpecialties(pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageSpecialtyDto>('/api/v1/specialties', {
      params: computed(() => pageRequest() as Record<string, unknown>),
    });
  }

  /**
   * Get specialty by ID
   * @param specialtyId Signal containing the specialty ID
   */
  getSpecialtyById(specialtyId: Signal<string>) {
    return this.apiService.apiGetResource<SpecialtyDto>(
      computed(() => `/api/v1/specialties/${specialtyId()}`)
    );
  }

  /**
   * Search specialties with search term
   * @param searchTerm Signal containing search term
   * @param pageRequest Signal containing pagination parameters
   */
  searchSpecialties(searchTerm: Signal<string | undefined>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageSpecialtyDto>('/api/v1/specialties/search', {
      params: computed(() => ({
        ...pageRequest(),
        searchTerm: searchTerm(),
      })),
    });
  }

  /**
   * Get active specialties with pagination
   * @param pageRequest Signal containing pagination parameters
   */
  getActiveSpecialties(pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageSpecialtyDto>('/api/v1/specialties/active', {
      params: computed(() => pageRequest() as Record<string, unknown>),
    });
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new specialty
   * @param request Specialty creation data
   * @returns Observable of the created specialty
   */
  createSpecialty(request: SpecialtyCreateRequest): Observable<SpecialtyDto> {
    return this.apiService.post<SpecialtyDto>('/api/v1/specialties', request);
  }

  /**
   * Update an existing specialty
   * @param specialtyId Specialty ID to update
   * @param request Updated specialty data
   * @returns Observable of the updated specialty
   */
  updateSpecialty(specialtyId: string, request: SpecialtyUpdateRequest): Observable<SpecialtyDto> {
    return this.apiService.put<SpecialtyDto>(`/api/v1/specialties/${specialtyId}`, request);
  }

  /**
   * Delete a specialty (soft delete - deactivate)
   * @param specialtyId Specialty ID to delete
   * @returns Observable that completes when specialty is deleted
   */
  deleteSpecialty(specialtyId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/specialties/${specialtyId}`);
  }
}
