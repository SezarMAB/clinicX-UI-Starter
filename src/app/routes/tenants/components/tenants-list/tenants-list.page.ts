import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TenantsService } from '@features/tenants/tenants.service';
import {
  TenantSummaryDto,
  PageTenantSummaryDto,
  TenantSearchCriteria,
} from '@features/tenants/tenants.models';
import { PageRequest } from '@core/models/pagination.model';
import { TenantFormDialog } from '../tenant-form/tenant-form.dialog';
import { ConfirmDeleteDialog } from '../confirm-delete/confirm-delete.dialog';
import { TableSkeletonComponent } from '../table-skeleton.component';
import { EmptyStateComponent } from '../empty-state.component';

/**
 * Tenants list page component
 * Displays tenants in a Material table with server-side pagination, sorting, and filtering
 */
@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    TableSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './tenants-list.page.html',
  styleUrls: ['./tenants-list.page.scss'],
})
export class TenantsListPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantsService = inject(TenantsService);
  private readonly destroyRef = inject(DestroyRef);

  // Table configuration
  readonly displayedColumns = [
    'name',
    'status',
    'users',
    'subscriptionPlan',
    'createdAt',
    'actions',
  ];

  // State signals
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly sortField = signal<string | undefined>(undefined);
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly searchCriteria = signal<TenantSearchCriteria | undefined>(undefined);
  readonly isProcessing = signal(false);

  // Computed signals
  readonly pageRequest = computed<PageRequest>(() => {
    const sort = this.sortField();
    return {
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: sort ? [`${sort},${this.sortDirection()}`] : ['createdAt,desc'],
    };
  });

  // Resource from service
  readonly tenantsResource = this.tenantsService.getAllTenants(
    this.pageRequest,
    this.searchCriteria
  );

  // Expose resource states
  readonly data = this.tenantsResource.value;
  readonly isLoading = this.tenantsResource.isLoading;
  readonly error = this.tenantsResource.error;

  // Form for filters
  readonly filtersForm = new FormGroup({
    searchTerm: new FormControl<string | null>(null),
    status: new FormControl<string | null>(null),
    subscriptionPlan: new FormControl<string | null>(null),
  });

  constructor() {
    // Sync URL params with state
    effect(() => {
      const params = {
        page: this.pageIndex().toString(),
        size: this.pageSize().toString(),
        ...(this.sortField() && { sort: this.sortField()!, dir: this.sortDirection() }),
        ...(this.searchCriteria() && this.searchCriteria()),
      };

      // Update URL without navigation
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
      });
    });

    // Update search criteria on form changes
    this.filtersForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(filters => {
        const criteria: TenantSearchCriteria = {
          ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
          ...(filters.status && { status: filters.status }),
          ...(filters.subscriptionPlan && { subscriptionPlan: filters.subscriptionPlan }),
        };

        this.searchCriteria.set(Object.keys(criteria).length > 0 ? criteria : undefined);
        this.pageIndex.set(0); // Reset to first page on filter change
      });
  }

  ngOnInit(): void {
    // Initialize from query params
    const params = this.route.snapshot.queryParams;

    if (params.page) this.pageIndex.set(+params.page);
    if (params.size) this.pageSize.set(+params.size);
    if (params.sort) this.sortField.set(params.sort);
    if (params.dir) this.sortDirection.set(params.dir as 'asc' | 'desc');

    // Set form values from params
    if (params.searchTerm) this.filtersForm.patchValue({ searchTerm: params.searchTerm });
    if (params.status) this.filtersForm.patchValue({ status: params.status as string });
    if (params.subscriptionPlan)
      this.filtersForm.patchValue({ subscriptionPlan: params.subscriptionPlan });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set((sort.direction as 'asc' | 'desc') || 'desc');
  }

  hasActiveFilters(): boolean {
    return !!this.searchCriteria();
  }

  resetFilters(): void {
    this.filtersForm.reset();
    this.searchCriteria.set(undefined);
    this.pageIndex.set(0);
  }

  refresh(): void {
    this.tenantsResource.reload();
  }

  viewDetails(tenant: TenantSummaryDto): void {
    if (!this.isProcessing()) {
      this.router.navigate([tenant.id], { relativeTo: this.route });
    }
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(TenantFormDialog, {
      width: '600px',
      disableClose: true,
      data: { mode: 'create' },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.refresh();
      this.snackBar.open('Tenant created successfully', 'Close', { duration: 3000 });
    }
  }

  async openEditDialog(tenant: TenantSummaryDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantFormDialog, {
      width: '600px',
      disableClose: true,
      data: { mode: 'edit', tenantId: tenant.id },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.refresh();
      this.snackBar.open('Tenant updated successfully', 'Close', { duration: 3000 });
    }
  }

  async confirmDelete(tenant: TenantSummaryDto): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: {
        title: 'Delete Tenant',
        message: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`,
        itemName: tenant.name,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await this.deleteTenant(tenant);
    }
  }

  private async deleteTenant(tenant: TenantSummaryDto): Promise<void> {
    this.isProcessing.set(true);
    try {
      await firstValueFrom(this.tenantsService.deleteTenant(tenant.id));
      this.refresh();
      this.snackBar.open('Tenant deleted successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to delete tenant', 'Close', { duration: 3000 });
    } finally {
      this.isProcessing.set(false);
    }
  }

  async activateTenant(tenant: TenantSummaryDto): Promise<void> {
    this.isProcessing.set(true);
    try {
      await firstValueFrom(this.tenantsService.activateTenant(tenant.id));
      this.refresh();
      this.snackBar.open('Tenant activated successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to activate tenant', 'Close', { duration: 3000 });
    } finally {
      this.isProcessing.set(false);
    }
  }

  async deactivateTenant(tenant: TenantSummaryDto): Promise<void> {
    this.isProcessing.set(true);
    try {
      await firstValueFrom(this.tenantsService.deactivateTenant(tenant.id));
      this.refresh();
      this.snackBar.open('Tenant deactivated successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to deactivate tenant', 'Close', { duration: 3000 });
    } finally {
      this.isProcessing.set(false);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
