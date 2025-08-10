import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TenantsService } from '../../features/tenants/tenants.service';
import { TenantDetailDto } from '../../features/tenants/tenants.models';
import { TenantFormDialog } from './tenant-form.dialog';
import { ConfirmDeleteDialog } from './confirm-delete.dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

/**
 * Tenant detail page component
 * Displays comprehensive tenant information in a read-only view
 */
@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading tenant details...</p>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-content">
              <mat-icon color="warn">error</mat-icon>
              <h2>Unable to load tenant</h2>
              <p>{{ error()?.message || 'An error occurred while loading the tenant details.' }}</p>
              <button mat-raised-button color="primary" (click)="reload()">
                <mat-icon>refresh</mat-icon>
                Try Again
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      } @else if (tenant()) {
        <div class="detail-header">
          <div class="header-content">
            <button mat-icon-button [routerLink]="['/tenants']" class="back-button">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="header-info">
              <h1>{{ tenant()!.name }}</h1>
              <div class="header-meta">
                <mat-chip [class]="tenant()!.isActive ? 'status-active' : 'status-inactive'">
                  {{ tenant()!.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
                <mat-chip class="plan-chip">
                  {{ tenant()!.subscriptionPlan }}
                </mat-chip>
                <code class="subdomain">{{ tenant()!.subdomain }}.clinic.com</code>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button mat-button (click)="openEditDialog()">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            @if (tenant()!.isActive) {
              <button mat-button (click)="deactivate()">
                <mat-icon>block</mat-icon>
                Deactivate
              </button>
            } @else {
              <button mat-button (click)="activate()">
                <mat-icon>check_circle</mat-icon>
                Activate
              </button>
            }
            <button mat-button color="warn" (click)="confirmDelete()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="info-grid">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>General Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <mat-list>
                      <mat-list-item>
                        <span matListItemTitle>Tenant ID</span>
                        <span matListItemMeta>{{ tenant()!.tenantId }}</span>
                      </mat-list-item>
                      <mat-list-item>
                        <span matListItemTitle>Realm Name</span>
                        <span matListItemMeta>{{ tenant()!.realmName }}</span>
                      </mat-list-item>
                      <mat-list-item>
                        <span matListItemTitle>Specialty</span>
                        <span matListItemMeta>{{ tenant()!.specialty }}</span>
                      </mat-list-item>
                      <mat-list-item>
                        <span matListItemTitle>Created</span>
                        <span matListItemMeta>{{ formatDate(tenant()!.createdAt) }}</span>
                      </mat-list-item>
                      <mat-list-item>
                        <span matListItemTitle>Last Updated</span>
                        <span matListItemMeta>{{ formatDate(tenant()!.updatedAt) }}</span>
                      </mat-list-item>
                    </mat-list>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Contact Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <mat-list>
                      <mat-list-item>
                        <span matListItemTitle>Email</span>
                        <span matListItemMeta>
                          <a [href]="'mailto:' + tenant()!.contactEmail">
                            {{ tenant()!.contactEmail }}
                          </a>
                        </span>
                      </mat-list-item>
                      @if (tenant()!.contactPhone) {
                        <mat-list-item>
                          <span matListItemTitle>Phone</span>
                          <span matListItemMeta>{{ tenant()!.contactPhone }}</span>
                        </mat-list-item>
                      }
                      @if (tenant()!.address) {
                        <mat-list-item>
                          <span matListItemTitle>Address</span>
                          <span matListItemMeta>{{ tenant()!.address }}</span>
                        </mat-list-item>
                      }
                    </mat-list>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Subscription">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Subscription Details</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Plan</span>
                      <span matListItemMeta>
                        <mat-chip class="plan-chip">{{ tenant()!.subscriptionPlan }}</mat-chip>
                      </span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Start Date</span>
                      <span matListItemMeta>{{ formatDate(tenant()!.subscriptionStartDate) }}</span>
                    </mat-list-item>
                    @if (tenant()!.subscriptionEndDate) {
                      <mat-list-item>
                        <span matListItemTitle>End Date</span>
                        <span matListItemMeta>{{
                          formatDate(tenant()!.subscriptionEndDate!)
                        }}</span>
                      </mat-list-item>
                    }
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>User Limit</span>
                      <span matListItemMeta>{{ tenant()!.maxUsers }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Current Users</span>
                      <span matListItemMeta>
                        {{ tenant()!.currentUsers }}
                        <span class="usage-percentage"> ({{ usagePercentage('users') }}%) </span>
                      </span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Patient Limit</span>
                      <span matListItemMeta>{{ tenant()!.maxPatients }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Current Patients</span>
                      <span matListItemMeta>
                        {{ tenant()!.currentPatients }}
                        <span class="usage-percentage"> ({{ usagePercentage('patients') }}%) </span>
                      </span>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Audit">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Audit Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Created By</span>
                      <span matListItemMeta>{{ tenant()!.createdBy }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Created At</span>
                      <span matListItemMeta>{{ formatDateTime(tenant()!.createdAt) }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Updated By</span>
                      <span matListItemMeta>{{ tenant()!.updatedBy }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Updated At</span>
                      <span matListItemMeta>{{ formatDateTime(tenant()!.updatedAt) }}</span>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 16px;
      }

      .error-card {
        max-width: 600px;
        margin: 0 auto;
      }

      .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
        padding: 32px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        background: var(--mat-card-background-color);
        padding: 24px;
        border-radius: 8px;
      }

      .header-content {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }

      .back-button {
        margin-top: 4px;
      }

      .header-info {
        h1 {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 400;
        }
      }

      .header-meta {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .subdomain {
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        padding: 4px 8px;
        background: var(--mat-grey-100);
        border-radius: 4px;
      }

      .status-active {
        background-color: var(--mat-green-100);
        color: var(--mat-green-800);
      }

      .status-inactive {
        background-color: var(--mat-grey-300);
        color: var(--mat-grey-700);
      }

      .plan-chip {
        background: var(--mat-primary-100);
        color: var(--mat-primary-700);
        text-transform: uppercase;
        font-size: 12px;
      }

      .tab-content {
        padding: 24px 0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 24px;
      }

      mat-list-item {
        height: auto !important;
        padding: 12px 0 !important;

        span[matListItemTitle] {
          font-weight: 500;
          color: var(--mat-secondary-text);
        }

        span[matListItemMeta] {
          text-align: right;
        }
      }

      .usage-percentage {
        color: var(--mat-secondary-text);
        font-size: 14px;
        margin-left: 8px;
      }

      @media (max-width: 768px) {
        .detail-header {
          flex-direction: column;
          gap: 16px;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TenantDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantsService = inject(TenantsService);
  private readonly destroyRef = inject(DestroyRef);

  tenantId = signal<string>('');

  // Create the resource in the injection context (field initializer)
  // The resource will react to changes in tenantId signal
  private readonly tenantResource = this.tenantsService.getTenantById(this.tenantId);

  tenant = computed(() => this.tenantResource.value() as TenantDetailDto | null);
  isLoading = computed(() => this.tenantResource.isLoading());
  error = computed(() => this.tenantResource.error());

  constructor() {
    const id = this.route.snapshot.params.id;
    if (id) {
      this.tenantId.set(id);
    }
  }

  reload(): void {
    this.tenantResource.reload();
  }

  usagePercentage(type: 'users' | 'patients'): number {
    const tenant = this.tenant();
    if (!tenant) return 0;

    if (type === 'users') {
      return Math.round((tenant.currentUsers / tenant.maxUsers) * 100);
    } else {
      return Math.round((tenant.currentPatients / tenant.maxPatients) * 100);
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openEditDialog(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    const dialogRef = this.dialog.open(TenantFormDialog, {
      width: '600px',
      data: { mode: 'edit', tenantId: tenant.id },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.reload();
          this.snackBar.open('Tenant updated successfully', 'Close', {
            duration: 3000,
          });
        }
      });
  }

  confirmDelete(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: {
        title: 'Delete Tenant',
        message: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`,
        itemName: tenant.name,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.deleteTenant();
        }
      });
  }

  private deleteTenant(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    this.tenantsService
      .deleteTenant(tenant.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Tenant deleted successfully', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/tenants']);
        },
        error: () => {
          this.snackBar.open('Failed to delete tenant', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  activate(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    this.tenantsService
      .activateTenant(tenant.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reload();
          this.snackBar.open('Tenant activated successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Failed to activate tenant', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  deactivate(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    this.tenantsService
      .deactivateTenant(tenant.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reload();
          this.snackBar.open('Tenant deactivated successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Failed to deactivate tenant', 'Close', {
            duration: 3000,
          });
        },
      });
  }
}
