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
import { TenantFormDialog } from './tenant-form.dialog';
import { ConfirmDeleteDialog } from './confirm-delete.dialog';
import { TableSkeletonComponent } from './components/table-skeleton.component';
import { EmptyStateComponent } from './components/empty-state.component';

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
  template: `
    <mat-card class="page-container">
      <mat-card-header>
        <mat-card-title>
          <div class="header-row">
            <h1>Tenants Management</h1>
            <button
              mat-raised-button
              color="primary"
              (click)="openCreateDialog()"
              [disabled]="isLoading()"
            >
              <mat-icon>add</mat-icon>
              Create Tenant
            </button>
          </div>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <!-- Search and Filters -->
        <div class="filters-container" [formGroup]="filtersForm">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input
              matInput
              formControlName="searchTerm"
              placeholder="Search by name, domain, email..."
            />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="INACTIVE">Inactive</mat-option>
              <mat-option value="SUSPENDED">Suspended</mat-option>
              <mat-option value="PENDING">Pending</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Subscription Plan</mat-label>
            <mat-select formControlName="subscriptionPlan">
              <mat-option [value]="null">All Plans</mat-option>
              <mat-option value="FREE">Free</mat-option>
              <mat-option value="BASIC">Basic</mat-option>
              <mat-option value="PROFESSIONAL">Professional</mat-option>
              <mat-option value="ENTERPRISE">Enterprise</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-stroked-button
            type="button"
            (click)="resetFilters()"
            [disabled]="isLoading()"
          >
            <mat-icon>clear</mat-icon>
            Clear Filters
          </button>
        </div>

        <!-- Loading State -->
        @if (isLoading() && !data()) {
          <app-table-skeleton [columns]="displayedColumns"></app-table-skeleton>
        }

        <!-- Data Table -->
        @if (data()) {
          @if (data()!.content.length === 0) {
            <app-empty-state
              icon="domain_disabled"
              title="No tenants found"
              [message]="
                hasActiveFilters()
                  ? 'No tenants match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first tenant.'
              "
              [showAction]="!hasActiveFilters()"
              actionLabel="Create First Tenant"
              (action)="openCreateDialog()"
            >
            </app-empty-state>
          } @else {
            <div class="table-container">
              <table
                mat-table
                [dataSource]="data()!.content"
                matSort
                (matSortChange)="onSortChange($event)"
                class="tenants-table"
              >
                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                  <td mat-cell *matCellDef="let tenant">
                    <div class="tenant-name">
                      <strong>{{ tenant.name }}</strong>
                      <small class="subdomain">{{ tenant.subdomain }}.clinic.com</small>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                  <td mat-cell *matCellDef="let tenant">
                    <mat-chip [class]="tenant.isActive ? 'status-active' : 'status-inactive'">
                      {{ tenant.isActive ? 'ACTIVE' : 'INACTIVE' }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Users Column -->
                <ng-container matColumnDef="users">
                  <th mat-header-cell *matHeaderCellDef>Users</th>
                  <td mat-cell *matCellDef="let tenant">
                    <span class="users-count">
                      {{ tenant.currentUsers }} / {{ tenant.maxUsers }}
                    </span>
                    @if (tenant.currentUsers >= tenant.maxUsers * 0.9) {
                      <mat-icon class="warning-icon" matTooltip="Approaching user limit">
                        warning
                      </mat-icon>
                    }
                  </td>
                </ng-container>

                <!-- Plan Column -->
                <ng-container matColumnDef="subscriptionPlan">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Plan</th>
                  <td mat-cell *matCellDef="let tenant">
                    <mat-chip class="plan-chip">
                      {{ tenant.subscriptionPlan }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Created Date Column -->
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                  <td mat-cell *matCellDef="let tenant">
                    {{ formatDate(tenant.createdAt) }}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let tenant">
                    <button
                      mat-icon-button
                      [matMenuTriggerFor]="menu"
                      [disabled]="isProcessing()"
                      (click)="$event.stopPropagation()"
                    >
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="viewDetails(tenant)">
                        <mat-icon>visibility</mat-icon>
                        <span>View Details</span>
                      </button>
                      <button mat-menu-item (click)="openEditDialog(tenant)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      @if (tenant.isActive) {
                        <button mat-menu-item (click)="deactivateTenant(tenant)">
                          <mat-icon>pause</mat-icon>
                          <span>Deactivate</span>
                        </button>
                      } @else {
                        <button mat-menu-item (click)="activateTenant(tenant)">
                          <mat-icon>play_arrow</mat-icon>
                          <span>Activate</span>
                        </button>
                      }
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="confirmDelete(tenant)" class="danger-action">
                        <mat-icon>delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                  class="tenant-row"
                  [class.clickable]="!isProcessing()"
                  (click)="viewDetails(row)"
                ></tr>
              </table>

              <!-- Paginator -->
              <mat-paginator
                [length]="data()!.totalElements"
                [pageSize]="pageSize()"
                [pageIndex]="pageIndex()"
                [pageSizeOptions]="[10, 25, 50, 100]"
                (page)="onPageChange($event)"
                showFirstLastButtons
              >
              </mat-paginator>
            </div>
          }
        }

        <!-- Error State -->
        @if (error()) {
          <div class="error-container">
            <mat-icon color="warn">error_outline</mat-icon>
            <p>Failed to load tenants. Please try again.</p>
            <button mat-raised-button color="primary" (click)="refresh()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .page-container {
        margin: 1rem;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      h1 {
        margin: 0;
        font-weight: 400;
      }

      .filters-container {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .search-field {
        flex: 1;
        min-width: 250px;
        max-width: 400px;
      }

      .table-container {
        position: relative;
        overflow: auto;
      }

      .tenants-table {
        width: 100%;
      }

      .tenant-row {
        &.clickable {
          cursor: pointer;
          &:hover {
            background-color: var(--mat-table-row-hover-bg);
          }
        }
      }

      .tenant-name {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        strong {
          font-weight: 500;
        }

        .subdomain {
          color: var(--mat-secondary-text);
          font-size: 0.875rem;
        }
      }

      .status-active {
        background-color: var(--mat-success-bg);
        color: var(--mat-success-text);
      }

      .status-inactive {
        background-color: var(--mat-warn-bg);
        color: var(--mat-warn-text);
      }

      .status-suspended {
        background-color: var(--mat-error-bg);
        color: var(--mat-error-text);
      }

      .status-pending {
        background-color: var(--mat-info-bg);
        color: var(--mat-info-text);
      }

      .users-count {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      .warning-icon {
        color: var(--mat-warn);
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }

      .plan-chip {
        text-transform: uppercase;
        font-size: 0.75rem;
      }

      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 3rem;
        text-align: center;

        mat-icon {
          font-size: 3rem;
          width: 3rem;
          height: 3rem;
        }
      }

      .danger-action {
        color: var(--mat-error);
      }

      @media (max-width: 768px) {
        .filters-container {
          flex-direction: column;

          .search-field {
            max-width: 100%;
          }
        }
      }
    `,
  ],
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
