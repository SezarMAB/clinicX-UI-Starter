import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged, Subject, firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPermissionsModule } from 'ngx-permissions';

import { TenantsService } from '@features/tenants/tenants.service';
import { TenantSummaryDto, TenantSearchCriteria } from '@features/tenants/tenants.models';
import { PageRequest } from '@core/models/pagination.model';
import { TenantFormDialog } from '../tenant-form/tenant-form.dialog';
import { ConfirmDeleteDialog } from '../confirm-delete/confirm-delete.dialog';
import { TenantTableComponent } from '../tenant-table/tenant-table.component';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatExpansionModule,
    TranslateModule,
    NgxPermissionsModule,
    TenantTableComponent,
  ],
  templateUrl: './tenants-list.page.html',
  styleUrls: ['./tenants-list.page.scss'],
})
export class TenantsListPage implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantsService = inject(TenantsService);

  // Loading state
  isLoading = signal(false);

  // Search functionality
  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  // Advanced filters
  showAdvancedFilters = signal(false);
  selectedStatus = signal<boolean | null>(null);
  selectedPlan = signal<string | null>(null);

  // Tenant data
  tenants = signal<TenantSummaryDto[]>([]);

  // Pagination state
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed signals
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatus() !== null) count++;
    if (this.selectedPlan() !== null) count++;
    return count;
  });

  pageRequest = computed<PageRequest>(() => {
    const sort = this.sortField();
    return {
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: sort ? [`${sort},${this.sortDirection()}`] : ['createdAt,desc'],
    };
  });

  searchCriteria = computed<TenantSearchCriteria | undefined>(() => {
    const searchTerm = this.searchTerm();
    const isActive = this.selectedStatus();

    // Only include properties that exist in TenantSearchCriteria
    // Note: subscriptionPlan filtering would need backend support
    if (searchTerm || isActive !== null) {
      return {
        ...(searchTerm && { searchTerm }),
        ...(isActive !== null && { isActive }),
      };
    }

    return undefined;
  });

  // Resource from service
  tenantsResource = this.tenantsService.getAllTenants(this.pageRequest, this.searchCriteria);

  constructor() {
    // Subscribe to search changes with debounce
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.pageIndex.set(0);
      this.searchTenants();
    });

    // Watch for data changes using effect
    effect(() => {
      // Update loading state
      this.isLoading.set(this.tenantsResource.isLoading());

      // Update data when available
      const data = this.tenantsResource.value();
      if (data) {
        this.tenants.set([...data.content]);
        this.totalElements.set(data.totalElements);
      }
    });
  }

  ngOnInit(): void {
    // Initialize from query params
    const params = this.route.snapshot.queryParams;
    if (params.page) this.pageIndex.set(+params.page);
    if (params.size) this.pageSize.set(+params.size);
    if (params.sort) this.sortField.set(params.sort);
    if (params.dir) this.sortDirection.set(params.dir as 'asc' | 'desc');
    if (params.searchTerm) this.searchTerm.set(params.searchTerm);
  }

  onSearchValueChange(value: string): void {
    this.searchSubject.next(value);
  }

  searchTenants(): void {
    this.tenantsResource.reload();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  clearFilters(): void {
    this.selectedStatus.set(null);
    this.selectedPlan.set(null);
    this.pageIndex.set(0);
    this.searchTenants();
  }

  onFilterChange(): void {
    // This method is called when filter values change
    // We don't search immediately, waiting for user to click Apply
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.searchTenants();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set((sort.direction as 'asc' | 'desc') || 'desc');
  }

  viewTenant(tenant: TenantSummaryDto): void {
    this.router.navigate([tenant.id], { relativeTo: this.route });
  }

  async editTenant(tenant: TenantSummaryDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantFormDialog, {
      width: '600px',
      disableClose: true,
      data: { mode: 'edit', tenantId: tenant.id },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.searchTenants();
      this.snackBar.open('Tenant updated successfully', 'Close', { duration: 3000 });
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
      this.searchTenants();
      this.snackBar.open('Tenant created successfully', 'Close', { duration: 3000 });
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
      try {
        await firstValueFrom(this.tenantsService.deleteTenant(tenant.id));
        this.searchTenants();
        this.snackBar.open('Tenant deleted successfully', 'Close', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Failed to delete tenant', 'Close', { duration: 3000 });
      }
    }
  }

  async toggleTenantStatus(tenant: TenantSummaryDto): Promise<void> {
    try {
      if (tenant.isActive) {
        await firstValueFrom(this.tenantsService.deactivateTenant(tenant.id));
        this.snackBar.open('Tenant deactivated successfully', 'Close', { duration: 3000 });
      } else {
        await firstValueFrom(this.tenantsService.activateTenant(tenant.id));
        this.snackBar.open('Tenant activated successfully', 'Close', { duration: 3000 });
      }
      this.searchTenants();
    } catch (error) {
      this.snackBar.open('Failed to update tenant status', 'Close', { duration: 3000 });
    }
  }
}
