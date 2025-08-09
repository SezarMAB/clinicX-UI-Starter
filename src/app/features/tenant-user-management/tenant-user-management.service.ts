import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  TenantUserDto,
  TenantUserCreateRequest,
  TenantUserUpdateRequest,
  UpdateUserRolesRequest,
  UserActivityDto,
  PageTenantUserDto,
  PageUserActivityDto,
  GrantExternalAccessRequest,
  ResetPasswordRequest,
} from './tenant-user-management.models';

/**
 * Service for managing tenant users
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class TenantUserManagementService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get paginated list of all users in the current tenant
   * @param includeExternal Signal containing whether to include external users
   */
  getAllUsers(includeExternal: Signal<boolean | undefined> = signal(undefined)) {
    return this.apiService.apiGetResource<PageTenantUserDto>('/api/v1/tenant/users', {
      params: computed(() => ({
        includeExternal: includeExternal(),
      })),
    });
  }

  /**
   * Get user details by ID
   * @param userId Signal containing the user ID
   */
  getUser(userId: Signal<string>) {
    return this.apiService.apiGetResource<TenantUserDto>(
      computed(() => `/api/v1/tenant/users/${userId()}`)
    );
  }

  /**
   * Get user activity history
   * @param userId Signal containing the user ID
   * @param pageRequest Signal containing pagination parameters
   */
  getUserActivity(userId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageUserActivityDto>(
      computed(() => `/api/v1/tenant/users/${userId()}/activity`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Search users with search term
   * @param searchTerm Signal containing search term
   */
  searchUsers(searchTerm: Signal<string | undefined> = signal(undefined)) {
    return this.apiService.apiGetResource<PageTenantUserDto>('/api/v1/tenant/users/search', {
      params: computed(() => ({
        searchTerm: searchTerm(),
      })),
    });
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new tenant user
   * @param request User creation data
   * @returns Observable of the created user
   */
  createUser(request: TenantUserCreateRequest): Observable<TenantUserDto> {
    return this.apiService.post<TenantUserDto>('/api/v1/tenant/users', request);
  }

  /**
   * Update an existing user
   * @param userId User ID to update
   * @param request Updated user data
   * @returns Observable of the updated user
   */
  updateUser(userId: string, request: TenantUserUpdateRequest): Observable<TenantUserDto> {
    return this.apiService.put<TenantUserDto>(`/api/v1/tenant/users/${userId}`, request);
  }

  /**
   * Update user roles
   * @param userId User ID
   * @param request New roles data
   * @returns Observable of the updated user
   */
  updateUserRoles(userId: string, request: UpdateUserRolesRequest): Observable<TenantUserDto> {
    return this.apiService.put<TenantUserDto>(`/api/v1/tenant/users/${userId}/roles`, request);
  }

  /**
   * Delete a user permanently
   * @param userId User ID to delete
   * @returns Observable that completes when user is deleted
   */
  deleteUser(userId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/tenant/users/${userId}`);
  }

  /**
   * Reset user password
   * @param userId User ID
   * @param request Password reset data
   * @returns Observable that completes when password is reset
   */
  resetUserPassword(userId: string, request: ResetPasswordRequest): Observable<void> {
    return this.apiService.post<void>(`/api/v1/tenant/users/${userId}/reset-password`, request);
  }

  /**
   * Deactivate a user
   * @param userId User ID to deactivate
   * @returns Observable that completes when user is deactivated
   */
  deactivateUser(userId: string): Observable<void> {
    return this.apiService.post<void>(`/api/v1/tenant/users/${userId}/deactivate`, {});
  }

  /**
   * Activate a user
   * @param userId User ID to activate
   * @returns Observable that completes when user is activated
   */
  activateUser(userId: string): Observable<void> {
    return this.apiService.post<void>(`/api/v1/tenant/users/${userId}/activate`, {});
  }

  /**
   * Grant access to an external user
   * @param request External user access data
   * @returns Observable of the created user
   */
  grantExternalUserAccess(request: GrantExternalAccessRequest): Observable<TenantUserDto> {
    return this.apiService.post<TenantUserDto>('/api/v1/tenant/users/grant-access', request);
  }

  /**
   * Revoke external user access
   * @param userId User ID to revoke access for
   * @returns Observable that completes when access is revoked
   */
  revokeExternalUserAccess(userId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/tenant/users/revoke-access/${userId}`);
  }
}
