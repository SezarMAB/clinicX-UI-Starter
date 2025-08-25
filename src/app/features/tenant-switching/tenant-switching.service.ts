import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import {
  MyTenant,
  CurrentTenant,
  TenantSyncResponse,
  TenantSwitchResponse,
} from './tenant-switching.models';

/**
 * Service for tenant switching and multi-tenant access management
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST operations
 */
@Injectable({ providedIn: 'root' })
export class TenantSwitchingService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get accessible tenants for the current user
   */
  getMyTenants() {
    return this.apiService.apiGetResource<MyTenant[]>('/api/auth/my-tenants');
  }

  /**
   * Get current tenant information
   */
  getCurrentTenant() {
    return this.apiService.apiGetResource<CurrentTenant>('/api/auth/current-tenant');
  }

  // --- POST Operations (Observables) ---

  /**
   * Sync user tenants to Keycloak
   * @returns Observable of sync response
   */
  syncTenants(): Observable<TenantSyncResponse> {
    return this.apiService.post<TenantSyncResponse>('/api/auth/sync-tenants', {});
  }

  /**
   * Switch active tenant
   * @param tenantId Tenant ID to switch to
   * @returns Observable of switch response
   */
  switchTenant(tenantId: string): Observable<TenantSwitchResponse> {
    return this.apiService.post<TenantSwitchResponse>('/api/auth/switch-tenant', {}, { tenantId });
  }
}
