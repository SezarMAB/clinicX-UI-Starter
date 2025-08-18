import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import {
  AuthService,
  KeycloakAuthService,
  TokenService,
  TenantService,
  TenantApiService,
} from '@core/authentication';
import { AccessibleTenant, TenantSwitchResponse } from '@core/authentication/interface';
import { switchMap, tap, catchError, of, take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-tenant-switcher',
  template: `
    @if (currentUser()) {
      <button mat-icon-button [matMenuTriggerFor]="tenantMenu" class="tenant-button">
        <mat-icon>business</mat-icon>
      </button>

      <mat-menu #tenantMenu="matMenu">
        <div class="menu-header">
          <div class="current-tenant">
            <mat-icon class="tenant-icon">{{ getTenantIcon(currentTenantSpecialty()) }}</mat-icon>
            <div class="tenant-info">
              <span class="tenant-name">{{ currentTenantName() }}</span>
              <span class="tenant-subtitle">{{ currentTenantSpecialty() }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        @for (tenant of accessibleTenants(); track tenant.tenant_id) {
          @if (tenant.tenant_id !== activeTenantId()) {
            <button mat-menu-item (click)="switchTenant(tenant)" [disabled]="switching()">
              <mat-icon>{{ getTenantIcon(tenant.specialty) }}</mat-icon>
              <span>{{ tenant.clinic_name }}</span>
            </button>
          }
        }
      </mat-menu>
    }
  `,

  styles: `
    .tenant-button {
      mat-icon {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .menu-header {
      padding: 16px;
      background-color: var(--mat-sys-surface-container);
    }

    .current-tenant {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tenant-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 50%;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
    }

    .tenant-name {
      font-weight: 500;
      font-size: 14px;
      color: var(--mat-sys-on-surface);
    }

    .tenant-subtitle {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      text-transform: capitalize;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
  ],
})
export class TenantSwitcherComponent implements OnInit {
  private authService = inject(AuthService);
  private keycloakService = inject(KeycloakAuthService);
  private tokenService = inject(TokenService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private tenantApiService = inject(TenantApiService);
  private snackBar = inject(MatSnackBar);

  // Signals
  switching = signal(false);
  currentUser = toSignal(this.authService.user());
  currentTenantId = signal<string | null>(null);

  // Computed values
  activeTenantId = computed(() => {
    // First priority: API current tenant
    const apiTenantId = this.currentTenantId();
    if (apiTenantId) {
      return apiTenantId;
    }
    // Fallback to user's active tenant or default tenant
    return this.currentUser()?.active_tenant_id || this.currentUser()?.tenant_id || '';
  });
  accessibleTenants = computed(() => {
    const tenants = this.currentUser()?.accessible_tenants;
    // Ensure we always return an array
    return Array.isArray(tenants) ? tenants : [];
  });

  currentTenantName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';

    // Try to find the current tenant in accessible tenants
    const tenants = this.accessibleTenants();
    if (Array.isArray(tenants) && tenants.length > 0) {
      const currentTenant = tenants.find(t => t.tenant_id === this.activeTenantId());
      if (currentTenant) return currentTenant.clinic_name;
    }

    // Fallback to user's clinic name
    return user.clinic_name || 'Select Tenant';
  });

  currentTenantSpecialty = computed(() => {
    const user = this.currentUser();
    if (!user) return null;

    // Try to find the current tenant in accessible tenants
    const tenants = this.accessibleTenants();
    if (Array.isArray(tenants) && tenants.length > 0) {
      const currentTenant = tenants.find(t => t.tenant_id === this.activeTenantId());
      if (currentTenant) return currentTenant.specialty;
    }

    // Fallback to user's specialty
    return user.specialty || null;
  });

  ngOnInit(): void {
    // Fetch current tenant from API
    this.tenantApiService.getCurrentTenant().subscribe(tenant => {
      if (tenant && tenant.tenantId) {
        this.currentTenantId.set(tenant.tenantId);
        console.log('Current tenant set to:', tenant.tenantId);
      }
    });
  }

  getTenantIcon(specialty: string | null): string {
    switch (specialty) {
      case 'DENTAL':
        return 'medical_services';
      case 'APPOINTMENTS':
        return 'event';
      case 'CLINIC':
      default:
        return 'local_hospital';
    }
  }

  getTenantRoleDisplay(tenant: AccessibleTenant): string {
    if (!tenant.roles || tenant.roles.length === 0) return '';

    // Show the highest role
    if (tenant.roles.includes('SUPER_ADMIN')) return 'Super Admin';
    if (tenant.roles.includes('ADMIN')) return 'Admin';
    if (tenant.roles.includes('DOCTOR')) return 'Doctor';
    if (tenant.roles.includes('NURSE')) return 'Nurse';
    if (tenant.roles.includes('RECEPTIONIST')) return 'Receptionist';
    if (tenant.roles.includes('ACCOUNTANT')) return 'Accountant';
    if (tenant.roles.includes('ASSISTANT')) return 'Assistant';

    return tenant.roles[0];
  }

  switchTenant(tenant: AccessibleTenant) {
    if (!this.canSwitchTenant(tenant)) {
      return;
    }

    this.switching.set(true);
    this.performTenantSwitch(tenant);
  }

  private canSwitchTenant(tenant: AccessibleTenant): boolean {
    return !this.switching() && tenant.tenant_id !== this.activeTenantId();
  }

  private performTenantSwitch(tenant: AccessibleTenant): void {
    console.log('Switching tenant:', tenant);

    // First, update the user BEFORE refreshing the token
    // This ensures the correct tenant context is set
    const currentUser = this.currentUser();

    // Build complete user_tenant_roles from accessible_tenants
    const userTenantRoles: { [tenantId: string]: string[] } = {};
    const accessibleTenants = currentUser?.accessible_tenants || [];

    // Build the mapping from accessible tenants
    accessibleTenants.forEach(t => {
      if (t.roles && t.roles.length > 0) {
        userTenantRoles[t.tenant_id] = t.roles;
      }
    });

    // Ensure the current tenant's roles are in the mapping
    if (tenant.roles && tenant.roles.length > 0) {
      userTenantRoles[tenant.tenant_id] = tenant.roles;
    }

    console.log('Updating user BEFORE tenant switch:', {
      active_tenant_id: tenant.tenant_id,
      current_roles: tenant.roles,
      user_tenant_roles: userTenantRoles,
    });

    // Update TenantService first to ensure it has the correct tenant
    this.tenantService.setTenant({
      tenant_id: tenant.tenant_id,
      clinic_name: tenant.clinic_name,
      clinic_type: tenant.clinic_type || tenant.specialty || 'APPOINTMENTS',
      subdomain: tenant.tenant_id,
    });

    // Update user with new tenant context
    // IMPORTANT: Preserve accessible_tenants to keep the tenant list in the UI
    this.authService.updateUser({
      active_tenant_id: tenant.tenant_id,
      tenant_id: tenant.tenant_id, // Also update tenant_id
      clinic_name: tenant.clinic_name,
      clinic_type: tenant.clinic_type,
      specialty: tenant.specialty,
      roles: tenant.roles || [],
      user_tenant_roles: userTenantRoles, // Complete mapping for all tenants
      accessible_tenants: accessibleTenants, // Preserve the list of accessible tenants
    });

    // Then perform the actual switch
    this.tenantApiService
      .switchTenant(tenant.tenant_id)
      .pipe(
        tap(response => this.handleSwitchResponse(response, tenant)),
        switchMap(() => this.authService.refresh()),
        // After refresh, ensure the user is updated with correct roles
        tap(() => {
          // Re-update user to ensure correct roles are set
          this.authService
            .user()
            .pipe(take(1))
            .subscribe(user => {
              if (user && user.active_tenant_id === tenant.tenant_id && user.user_tenant_roles) {
                // Ensure the roles are correct for the current tenant
                const tenantRoles = user.user_tenant_roles[tenant.tenant_id] || [];
                if (JSON.stringify(tenantRoles) !== JSON.stringify(tenant.roles)) {
                  console.log('Correcting roles after switch:', {
                    expected: tenant.roles,
                    actual: tenantRoles,
                    accessible_tenants_count: user.accessible_tenants?.length || 0,
                  });
                  // Force correct the roles while preserving accessible_tenants
                  this.authService.updateUser({
                    roles: tenant.roles || [],
                    accessible_tenants: user.accessible_tenants, // Preserve tenant list
                  });
                }

                // Also check if accessible_tenants was lost
                if (!user.accessible_tenants || user.accessible_tenants.length === 0) {
                  console.warn('accessible_tenants was lost, refetching...');
                  // Refetch tenants if they were lost
                  this.tenantApiService
                    .getMyTenants()
                    .pipe(take(1))
                    .subscribe(tenants => {
                      this.authService.updateUser({
                        accessible_tenants: tenants,
                      });
                    });
                }
              }
            });
        }),
        tap(() => this.handleSwitchSuccess(tenant)),
        catchError(error => this.handleSwitchError(error))
      )
      .subscribe(() => {
        this.switching.set(false);
      });
  }

  private handleSwitchResponse(response: TenantSwitchResponse, tenant: AccessibleTenant): void {
    console.log('Switch tenant response:', response);
    this.tokenService.setCurrentTenantId(tenant.tenant_id);

    if (response?.token) {
      this.tokenService.set({
        access_token: response.token,
        token_type: 'Bearer',
        expires_in: 300,
        refresh_token: this.tokenService.getRefreshToken() || '',
      });
    }
  }

  private handleSwitchSuccess(tenant: AccessibleTenant): void {
    // Update the current tenant ID signal
    this.currentTenantId.set(tenant.tenant_id);
    this.updateCurrentUser(tenant);
    this.showSuccessMessage(tenant.clinic_name);
    this.router.navigate(['/dashboard']);
  }

  private updateCurrentUser(tenant: AccessibleTenant): void {
    // User is already updated in performTenantSwitch after token refresh
    // This method is called from handleSwitchSuccess for any additional updates
    const currentUser = this.currentUser();
    if (currentUser) {
      // Just update the local signal for UI display
      currentUser.active_tenant_id = tenant.tenant_id;
      currentUser.clinic_name = tenant.clinic_name;
      currentUser.clinic_type = tenant.clinic_type;
      currentUser.specialty = tenant.specialty;
    }
  }

  private showSuccessMessage(clinicName: string): void {
    this.snackBar.open(`Switched to ${clinicName}`, 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  private handleSwitchError(error: any) {
    console.error('Failed to switch tenant:', error);
    this.switching.set(false);

    const errorMessage = error?.error?.message || 'Failed to switch tenant. Please try again.';
    this.snackBar.open(errorMessage, 'OK', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });

    return of(null);
  }
}
