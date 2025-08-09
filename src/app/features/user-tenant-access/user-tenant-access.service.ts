import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { UserTenantAccessDto, GrantTenantAccessRequest } from './user-tenant-access.models';

/**
 * Service for managing user tenant access
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class UserTenantAccessService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get user's tenant access
   * @param userId Signal containing the user ID
   */
  getUserTenantAccess(userId: Signal<string>) {
    return this.apiService.apiGetResource<UserTenantAccessDto[]>(
      computed(() => `/api/v1/users/${userId()}/tenant-access`)
    );
  }

  // --- POST/DELETE Operations (Observables) ---

  /**
   * Grant tenant access to user
   * @param userId User ID
   * @param request Grant access request
   * @returns Observable of grant result
   */
  grantTenantAccess(
    userId: string,
    request: GrantTenantAccessRequest
  ): Observable<UserTenantAccessDto> {
    return this.apiService.post<UserTenantAccessDto>(
      `/api/v1/users/${userId}/tenant-access`,
      request
    );
  }

  /**
   * Revoke tenant access from user
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Observable that completes when access is revoked
   */
  revokeTenantAccess(userId: string, tenantId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/users/${userId}/tenant-access/${tenantId}`);
  }
}
