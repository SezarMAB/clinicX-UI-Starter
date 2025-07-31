import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { UserTenantResponse, AccessibleTenant, TenantSwitchResponse } from './interface';

/**
 * Service for handling tenant-related API calls
 */
@Injectable({
  providedIn: 'root',
})
export class TenantApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || '/api';

  /**
   * Get current user's accessible tenants
   * @returns Observable of user tenants
   */
  getMyTenants(): Observable<AccessibleTenant[]> {
    const url = `${this.apiUrl}/auth/my-tenants`;
    console.log('Fetching tenants from:', url);

    return this.http.get<UserTenantResponse[]>(url).pipe(
      tap(response => {
        console.log('Raw tenant response:', response);
      }),
      map(tenants =>
        tenants.map(tenant => ({
          tenant_id: tenant.id,
          clinic_name: tenant.name,
          clinic_type: tenant.specialty,
          specialty: tenant.specialty,
          roles: tenant.roles,
        }))
      ),
      tap(tenants => {
        console.log('Fetched user tenants:', tenants);
      }),
      catchError(error => {
        console.error('Error fetching user tenants:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          url: error.url,
          headers: error.headers,
        });
        // Return empty array on error to prevent app crash
        return of([]);
      })
    );
  }

  /**
   * Switch to a different tenant
   * @param tenantId The tenant ID to switch to
   * @returns Observable of switch result
   */
  switchTenant(tenantId: string): Observable<TenantSwitchResponse> {
    // Backend expects tenantId as query parameter
    return this.http
      .post<TenantSwitchResponse>(`${this.apiUrl}/auth/switch-tenant?tenantId=${tenantId}`, {})
      .pipe(
        tap(response => {
          console.log('Tenant switch successful:', response);
        }),
        catchError(error => {
          console.error('Error switching tenant:', error);
          throw error;
        })
      );
  }

  /**
   * Get tenant details by ID
   * @param tenantId The tenant ID
   * @returns Observable of tenant details
   */
  getTenantDetails(tenantId: string): Observable<UserTenantResponse | null> {
    return this.http.get<UserTenantResponse>(`${this.apiUrl}/tenants/${tenantId}`).pipe(
      catchError(error => {
        console.error('Error fetching tenant details:', error);
        return of(null);
      })
    );
  }
}
