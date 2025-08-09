import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { AuthTestResponse } from './authentication-test.models';

/**
 * Service for authentication testing endpoints
 * Provides reactive queries via httpResource for GET operations
 */
@Injectable({ providedIn: 'root' })
export class AuthenticationTestService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Public endpoint - accessible to everyone
   */
  publicEndpoint() {
    return this.apiService.apiGetResource<AuthTestResponse>('/api/auth/test/public');
  }

  /**
   * Authenticated endpoint - requires valid authentication
   */
  authenticatedEndpoint() {
    return this.apiService.apiGetResource<AuthTestResponse>('/api/auth/test/authenticated');
  }

  /**
   * Admin only endpoint - requires ADMIN role
   */
  adminEndpoint() {
    return this.apiService.apiGetResource<AuthTestResponse>('/api/auth/test/admin');
  }

  /**
   * Doctor only endpoint - requires DOCTOR role
   */
  doctorEndpoint() {
    return this.apiService.apiGetResource<AuthTestResponse>('/api/auth/test/doctor');
  }

  /**
   * Staff only endpoint - requires STAFF role
   */
  staffEndpoint() {
    return this.apiService.apiGetResource<AuthTestResponse>('/api/auth/test/staff');
  }

  /**
   * Multi-role endpoint - requires multiple roles
   */
  multiRoleEndpoint() {
    return this.apiService.apiGetResource<AuthTestResponse>('/api/auth/test/multi-role');
  }
}
