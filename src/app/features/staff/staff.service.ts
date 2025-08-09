import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import {
  StaffDto,
  StaffCreateRequest,
  StaffUpdateRequest,
  StaffSearchCriteria,
  PageStaffDto,
  StaffSummaryDto,
} from './staff.models';

/**
 * Service for managing staff members
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get all staff members with pagination
   * @param pageRequest Signal containing pagination parameters
   */
  getAllStaff(pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageStaffDto>('/api/v1/staff', {
      params: computed(() => pageRequest() as Record<string, unknown>),
    });
  }

  /**
   * Get staff member by ID
   * @param staffId Signal containing the staff ID
   */
  getStaffById(staffId: Signal<string>) {
    return this.apiService.apiGetResource<StaffDto>(computed(() => `/api/v1/staff/${staffId()}`));
  }

  /**
   * Get active staff members with pagination
   * @param pageRequest Signal containing pagination parameters
   */
  getActiveStaff(pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageStaffDto>('/api/v1/staff/active', {
      params: computed(() => pageRequest() as Record<string, unknown>),
    });
  }

  /**
   * Search staff members with search term
   * @param searchTerm Signal containing search term
   * @param pageRequest Signal containing pagination parameters
   */
  searchStaff(searchTerm: Signal<string | undefined>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageStaffDto>('/api/v1/staff/search', {
      params: computed(() => ({
        ...pageRequest(),
        searchTerm: searchTerm(),
      })),
    });
  }

  /**
   * Get staff members by role
   * @param role Signal containing the staff role
   * @param pageRequest Signal containing pagination parameters
   */
  getStaffByRole(role: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageStaffDto>(
      computed(() => `/api/v1/staff/by-role/${role()}`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new staff member
   * @param request Staff creation data
   * @returns Observable of the created staff member
   */
  createStaff(request: StaffCreateRequest): Observable<StaffDto> {
    return this.apiService.post<StaffDto>('/api/v1/staff', request);
  }

  /**
   * Update an existing staff member
   * @param staffId Staff ID to update
   * @param request Updated staff data
   * @returns Observable of the updated staff member
   */
  updateStaff(staffId: string, request: StaffUpdateRequest): Observable<StaffDto> {
    return this.apiService.put<StaffDto>(`/api/v1/staff/${staffId}`, request);
  }

  /**
   * Delete a staff member (soft delete - deactivate)
   * @param staffId Staff ID to delete
   * @returns Observable that completes when staff member is deleted
   */
  deleteStaff(staffId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/staff/${staffId}`);
  }

  /**
   * Advanced staff search
   * @param searchCriteria Search criteria
   * @param pageRequest Pagination parameters
   * @returns Observable of search results
   */
  advancedSearchStaff(
    searchCriteria: StaffSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PageStaffDto> {
    return this.apiService.post<PageStaffDto>(
      '/api/v1/staff/search/advanced',
      searchCriteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }
}
