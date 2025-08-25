import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ClinicInfoDto, ClinicInfoUpdateRequest } from './clinic-info.models';

/**
 * Service for managing clinic information
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for PUT operations
 */
@Injectable({ providedIn: 'root' })
export class ClinicInfoService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get clinic information
   */
  getClinicInfo() {
    return this.apiService.apiGetResource<ClinicInfoDto>('/api/v1/clinic-info');
  }

  // --- PUT Operations (Observables) ---

  /**
   * Update clinic information
   * @param request Clinic info update data
   * @returns Observable of updated clinic info
   */
  updateClinicInfo(request: ClinicInfoUpdateRequest): Observable<ClinicInfoDto> {
    return this.apiService.put<ClinicInfoDto>('/api/v1/clinic-info', request);
  }
}
