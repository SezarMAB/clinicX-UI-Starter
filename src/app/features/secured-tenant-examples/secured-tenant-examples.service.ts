import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  MedicalRecord,
  SecuredResponse,
  TenantSettings,
  TenantInfo,
  SystemAudit,
  MyTenant,
  SecuredAppointment,
  SecuredTenantUser,
  DynamicActionRequest,
} from './secured-tenant-examples.models';

/**
 * Service for secured tenant examples
 * Demonstrates multi-tenant security patterns
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class SecuredTenantExamplesService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get tenant settings by tenant ID
   * @param tenantId Signal containing the tenant ID
   */
  getTenantSettings(tenantId: Signal<string>) {
    return this.apiService.apiGetResource<TenantSettings>(
      computed(() => `/api/v1/secure/tenants/${tenantId()}/settings`)
    );
  }

  /**
   * Get current tenant information
   */
  getCurrentTenantInfo() {
    return this.apiService.apiGetResource<TenantInfo>('/api/v1/secure/tenant-info');
  }

  /**
   * Get system audit information (admin only)
   */
  getSystemAudit() {
    return this.apiService.apiGetResource<SystemAudit>('/api/v1/secure/system/audit');
  }

  /**
   * Get my accessible tenants
   */
  getMyTenants() {
    return this.apiService.apiGetResource<MyTenant[]>('/api/v1/secure/my-tenants');
  }

  /**
   * Get appointments from secured endpoint
   */
  getAppointments() {
    return this.apiService.apiGetResource<SecuredAppointment[]>('/api/v1/secure/appointments');
  }

  /**
   * Get tenant users (Admin only)
   */
  getTenantUsers() {
    return this.apiService.apiGetResource<SecuredTenantUser[]>('/api/v1/secure/admin/users');
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Update medical record
   * @param recordId Medical record ID to update
   * @param data Updated medical record data
   * @returns Observable of the response
   */
  updateMedicalRecord(recordId: string, data: MedicalRecord): Observable<SecuredResponse> {
    return this.apiService.put<SecuredResponse>(`/api/v1/secure/medical-records/${recordId}`, data);
  }

  /**
   * Perform dynamic action
   * @param request Action request data
   * @returns Observable of the response
   */
  performDynamicAction(request: DynamicActionRequest): Observable<SecuredResponse> {
    return this.apiService.post<SecuredResponse>('/api/v1/secure/dynamic-action', request);
  }
}
