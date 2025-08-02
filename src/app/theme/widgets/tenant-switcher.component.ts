import { Component, inject, signal, computed, effect } from '@angular/core';
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
  TenantApiService,
} from '@core/authentication';
import { AccessibleTenant, TenantSwitchRequest } from '@core/authentication/interface';
import { switchMap, tap, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-tenant-switcher',
  template: `
    @if (currentUser()) {
      <button mat-button [matMenuTriggerFor]="tenantMenu" class="tenant-switcher">
        <mat-icon>business</mat-icon>
        <span class="tenant-name">{{ currentTenantName() }}</span>
        @if (currentTenantSpecialty()) {
          <span
            class="tenant-specialty"
            [ngClass]="'specialty-' + (currentTenantSpecialty() | lowercase)"
          >
            {{ currentTenantSpecialty() }}
          </span>
        }
        <mat-icon>arrow_drop_down</mat-icon>
      </button>

      <mat-menu #tenantMenu="matMenu" class="tenant-menu">
        <div class="tenant-menu-header">
          <h3>Switch Tenant</h3>
          <span class="tenant-count">{{ accessibleTenants().length }} available</span>
        </div>
        <mat-divider></mat-divider>

        @for (tenant of accessibleTenants(); track tenant.tenant_id) {
          <button
            mat-menu-item
            (click)="switchTenant(tenant)"
            [class.active]="tenant.tenant_id === activeTenantId()"
            [disabled]="switching() || tenant.tenant_id === activeTenantId()"
          >
            <mat-icon>{{ getTenantIcon(tenant.specialty) }}</mat-icon>
            <div class="tenant-item">
              <span class="tenant-item-name">{{ tenant.clinic_name }}</span>
              <span class="tenant-item-info">
                <span
                  class="tenant-specialty-badge"
                  [ngClass]="'specialty-' + (tenant.specialty | lowercase)"
                >
                  {{ tenant.specialty }}
                </span>
                <span class="tenant-roles">{{ getTenantRoleDisplay(tenant) }}</span>
              </span>
            </div>
            @if (tenant.tenant_id === activeTenantId()) {
              <mat-icon class="check-icon">check_circle</mat-icon>
            }
          </button>
        }
      </mat-menu>
    }
  `,
  styles: [
    `
      .tenant-switcher {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
        border-radius: 20px;
        background-color: rgba(0, 0, 0, 0.04);

        .mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .tenant-name {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .tenant-specialty {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
          text-transform: uppercase;

          &.specialty-clinic {
            background-color: #e3f2fd;
            color: #1976d2;
          }

          &.specialty-dental {
            background-color: #e8f5e9;
            color: #388e3c;
          }

          &.specialty-appointments {
            background-color: #fff3e0;
            color: #f57c00;
          }
        }
      }

      .tenant-menu {
        .tenant-menu-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
          }

          .tenant-count {
            font-size: 12px;
            color: rgba(0, 0, 0, 0.6);
          }
        }

        .mat-menu-item {
          height: auto;
          padding: 12px 16px;
          line-height: normal;

          &.active {
            background-color: rgba(0, 150, 136, 0.08);
          }

          &:hover:not(:disabled) {
            background-color: rgba(0, 0, 0, 0.04);
          }

          .tenant-item {
            display: flex;
            flex-direction: column;
            margin-left: 12px;
            flex-grow: 1;

            .tenant-item-name {
              font-weight: 500;
              margin-bottom: 4px;
            }

            .tenant-item-info {
              display: flex;
              gap: 8px;
              align-items: center;
              font-size: 12px;
              color: rgba(0, 0, 0, 0.6);

              .tenant-specialty-badge {
                padding: 2px 6px;
                border-radius: 10px;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 10px;

                &.specialty-clinic {
                  background-color: #e3f2fd;
                  color: #1976d2;
                }

                &.specialty-dental {
                  background-color: #e8f5e9;
                  color: #388e3c;
                }

                &.specialty-appointments {
                  background-color: #fff3e0;
                  color: #f57c00;
                }
              }
            }
          }

          .check-icon {
            color: #009688;
            margin-left: 8px;
          }
        }
      }
    `,
  ],
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
export class TenantSwitcherComponent {
  private authService = inject(AuthService);
  private keycloakService = inject(KeycloakAuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private tenantApiService = inject(TenantApiService);
  private snackBar = inject(MatSnackBar);

  // Signals
  switching = signal(false);
  currentUser = toSignal(this.authService.user());

  // Computed values
  activeTenantId = computed(
    () => this.currentUser()?.active_tenant_id || this.currentUser()?.tenant_id || ''
  );
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

  getTenantIcon(specialty: string): string {
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
    if (this.switching() || tenant.tenant_id === this.activeTenantId()) {
      return;
    }

    this.switching.set(true);

    this.tenantApiService
      .switchTenant(tenant.tenant_id)
      .pipe(
        tap(response => {
          console.log('Switch tenant response:', response);
          // Update the current tenant ID in token service
          this.tokenService.setCurrentTenantId(tenant.tenant_id);

          // Update the token in the token service if a new token is returned
          if (response?.token) {
            this.tokenService.set({
              access_token: response.token,
              token_type: 'Bearer',
              expires_in: 300, // Default 5 minutes, will be refreshed
              refresh_token: this.tokenService.getRefreshToken() || '',
            });
          }
        }),
        switchMap(() => {
          // Refresh auth state to get updated user info
          return this.authService.refresh();
        }),
        tap(() => {
          // Update the current user's active tenant
          const currentUser = this.currentUser();
          if (currentUser) {
            currentUser.active_tenant_id = tenant.tenant_id;
            currentUser.clinic_name = tenant.clinic_name;
            currentUser.clinic_type = tenant.clinic_type;
            currentUser.specialty = tenant.specialty;
          }

          // Show success message
          this.snackBar.open(`Switched to ${tenant.clinic_name}`, 'OK', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          // Navigate to dashboard after successful switch
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          console.error('Failed to switch tenant:', error);
          this.switching.set(false);

          // Show error message
          const errorMessage =
            error?.error?.message || 'Failed to switch tenant. Please try again.';
          this.snackBar.open(errorMessage, 'OK', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });

          return of(null);
        })
      )
      .subscribe(() => {
        this.switching.set(false);
      });
  }
}
