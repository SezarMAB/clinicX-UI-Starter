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

import { TenantsService } from '@features/tenants/tenants.service';
import { TenantDetailDto } from '@features/tenants/tenants.models';
import { TenantFormDialog } from '../tenant-form/tenant-form.dialog';
import { ConfirmDeleteDialog } from '../confirm-delete/confirm-delete.dialog';
import { ResetPasswordDialog } from './reset-password.dialog';
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
  templateUrl: './tenant-detail.page.html',
  styleUrls: ['./tenant-detail.page.scss'],
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
        title: 'Deactivate Tenant',
        message: `Are you sure you want to deactivate "${tenant.name}"? This will disable the tenant and all its users. The tenant can be reactivated later.`,
        itemName: tenant.name,
        confirmText: 'Deactivate',
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
          this.snackBar.open('Tenant deactivated successfully', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/tenants']);
        },
        error: () => {
          this.snackBar.open('Failed to deactivate tenant', 'Close', {
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

  openResetPasswordDialog(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    const dialogRef = this.dialog.open(ResetPasswordDialog, {
      width: '500px',
      data: {
        tenantId: tenant.id,
        tenantName: tenant.name,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          // Success snackbar is already shown by the dialog
          console.log('Password reset completed successfully');
        }
      });
  }
}
