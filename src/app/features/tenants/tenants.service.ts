import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import {
  TenantDetailDto,
  TenantSummaryDto,
  TenantCreateRequest,
  TenantUpdateRequest,
  TenantCreationResponseDto,
  PageTenantSummaryDto,
  TenantSearchCriteria,
  SubdomainAvailabilityDto,
} from './tenants.models';
import { HttpResourceRef } from '@angular/common/http';

/**
 * Service for managing tenants
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all tenants with pagination and filtering
   * @param pageRequest Signal containing pagination parameters
   * @param searchCriteria Signal containing search/filter criteria
   */
  getAllTenants(
    pageRequest: Signal<PageRequest>,
    searchCriteria: Signal<TenantSearchCriteria | undefined> = signal(undefined)
  ) {
    return this.apiService.apiGetResource<PageTenantSummaryDto>('/api/v1/tenants', {
      params: computed(() => {
        const page = pageRequest();
        const criteria = searchCriteria();
        return {
          page: page.page,
          size: page.size,
          sort: page.sort,
          ...(criteria?.searchTerm && { searchTerm: criteria.searchTerm }),
          ...(criteria?.isActive !== undefined && { isActive: criteria.isActive }),
        };
      }),
    });
  }

  /**
   * Get tenant by ID
   * @param tenantId Signal containing the tenant ID
   */
  getTenantById(tenantId: Signal<string>) {
    return this.apiService.apiGetResource<TenantDetailDto>(
      computed(() => {
        const id = tenantId();
        // Only return a valid URL if we have an ID
        return id ? `/api/v1/tenants/${id}` : '';
      })
    );
  }

  /**
   * Check subdomain availability
   * @param subdomain Signal containing the subdomain to check
   */
  checkSubdomainAvailability(
    subdomain: Signal<string>
  ): HttpResourceRef<SubdomainAvailabilityDto | undefined> {
    return this.apiService.apiGetResource<SubdomainAvailabilityDto>(
      computed(() => {
        const value = subdomain();
        // Only return a valid URL if subdomain has at least 3 characters
        // Return empty string to skip the request
        return value && value.length >= 3 ? `/api/v1/tenants/check-subdomain/${value}` : '';
      })
    );
  }

  /**
   * Get tenant by subdomain
   * @param subdomain Signal containing the subdomain
   */
  getTenantBySubdomain(subdomain: Signal<string>) {
    return this.apiService.apiGetResource<TenantDetailDto>(
      computed(() => `/api/v1/tenants/by-subdomain/${subdomain()}`)
    );
  }

  /**
   * Create a new tenant
   * @param request Tenant creation data
   * @returns Observable of the tenant creation response
   */
  createTenant(request: TenantCreateRequest): Observable<TenantCreationResponseDto> {
    return this.apiService.post<TenantCreationResponseDto>('/api/v1/tenants', request);
  }

  /**
   * Update an existing tenant
   * @param tenantId Tenant ID to update
   * @param request Updated tenant data
   * @returns Observable of the updated tenant
   */
  updateTenant(tenantId: string, request: TenantUpdateRequest): Observable<TenantDetailDto> {
    return this.apiService.put<TenantDetailDto>(`/api/v1/tenants/${tenantId}`, request);
  }

  /**
   * Delete a tenant permanently
   * @param tenantId Tenant ID to delete
   * @returns Observable that completes when tenant is deleted
   */
  deleteTenant(tenantId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/tenants/${tenantId}`);
  }

  /**
   * Activate a tenant
   * @param tenantId Tenant ID to activate
   * @returns Observable that completes when tenant is activated
   */
  activateTenant(tenantId: string): Observable<void> {
    return this.apiService.post<void>(`/api/v1/tenants/${tenantId}/activate`, {});
  }

  /**
   * Deactivate a tenant
   * @param tenantId Tenant ID to deactivate
   * @returns Observable that completes when tenant is deactivated
   */
  deactivateTenant(tenantId: string): Observable<void> {
    return this.apiService.post<void>(`/api/v1/tenants/${tenantId}/deactivate`, {});
  }
}
