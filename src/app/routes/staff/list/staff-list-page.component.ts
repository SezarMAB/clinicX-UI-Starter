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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject, firstValueFrom } from 'rxjs';

import { StaffService } from '../../../features/staff/staff.service';
import {
  StaffDto,
  StaffRole,
  StaffSearchCriteria,
  Page,
} from '../../../features/staff/staff.models';
import { PageRequest } from '../../../core/models/pagination.model';
import { StaffAdvancedSearchDialog } from '../advanced-search/staff-advanced-search.dialog';
import { StaffDeleteConfirmDialog } from '../shared/staff-delete-confirm.dialog';
import { StaffApiService } from '../../../features/staff/staff-api.service';

@Component({
  selector: 'app-staff-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  templateUrl: './staff-list-page.component.html',
  styleUrls: ['./staff-list-page.component.scss'],
})
export class StaffListPageComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly staffService = inject(StaffService);
  private readonly staffApi = inject(StaffApiService);

  // Table columns
  readonly displayedColumns = ['fullName', 'email', 'phoneNumber', 'role', 'isActive', 'actions'];
  readonly staffRoles = Object.values(StaffRole);

  // Loading state
  isLoading = signal(false);

  // Search functionality
  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  // Filters
  selectedRole = signal<StaffRole | null>(null);
  activeFilter = signal<boolean | null>(null);
  advancedCriteria = signal<StaffSearchCriteria | null>(null);
  showAdvancedFilters = signal(false);

  // Staff data
  staffData = signal<StaffDto[]>([]);

  // Pagination state
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  sortField = signal<string>('fullName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Computed signals
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedRole() !== null) count++;
    if (this.activeFilter() !== null) count++;
    if (this.advancedCriteria() !== null) count++;
    return count;
  });

  pageRequest = computed<PageRequest>(() => {
    const sort = this.sortField();
    return {
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: sort ? [`${sort},${this.sortDirection()}`] : ['fullName,asc'],
    };
  });

  searchCriteria = computed<StaffSearchCriteria | undefined>(() => {
    const advanced = this.advancedCriteria();
    if (advanced) {
      return advanced;
    }

    const searchTerm = this.searchTerm();
    const role = this.selectedRole();
    const isActive = this.activeFilter();

    if (searchTerm || role || isActive !== null) {
      return {
        ...(searchTerm && { searchTerm }),
        ...(role && { role }),
        ...(isActive !== null && { isActive }),
      };
    }

    return undefined;
  });

  // Resource from service - use the StaffService which properly initializes resources
  staffResource = this.staffService.searchStaff(this.pageRequest, this.searchCriteria);

  constructor() {
    // Subscribe to search changes with debounce
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.pageIndex.set(0);
    });

    // Watch for data changes using effect
    effect(() => {
      // Update loading state
      this.isLoading.set(this.staffResource.isLoading());

      // Handle error state
      if (this.staffResource.error()) {
        this.snackBar.open('Error loading staff data', 'Close', { duration: 3000 });
      }

      // Update data when available
      const data = this.staffResource.value();
      if (data) {
        this.staffData.set([...data.content]);
        this.totalElements.set(data.totalElements);
      }
    });

    // Handle advanced search separately (POST request)
    effect(async () => {
      const criteria = this.advancedCriteria();
      if (criteria && Object.keys(criteria).length > 0) {
        this.isLoading.set(true);
        try {
          const result = await firstValueFrom(
            this.staffApi.advancedSearch(criteria, {
              page: this.pageIndex(),
              size: this.pageSize(),
              sort: `${this.sortField()},${this.sortDirection()}`,
            })
          );
          this.staffData.set([...result.content]);
          this.totalElements.set(result.totalElements);
        } catch (error) {
          this.snackBar.open('Error performing advanced search', 'Close', { duration: 3000 });
        } finally {
          this.isLoading.set(false);
        }
      }
    });
  }

  ngOnInit(): void {
    // Initialize from query params
    const params = this.route.snapshot.queryParams;
    if (params.page) this.pageIndex.set(+params.page);
    if (params.size) this.pageSize.set(+params.size);
    if (params.sort) {
      const [field, dir] = params.sort.split(',');
      this.sortField.set(field);
      this.sortDirection.set(dir as 'asc' | 'desc');
    }
    if (params.searchTerm) this.searchTerm.set(params.searchTerm);
    if (params.role) this.selectedRole.set(params.role as StaffRole);
    if (params.active !== undefined) this.activeFilter.set(params.active === 'true');
  }

  onSearchValueChange(value: string): void {
    this.searchSubject.next(value);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set(null);
    this.activeFilter.set(null);
    this.advancedCriteria.set(null);
    this.pageIndex.set(0);
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.updateQueryParams();
  }

  async openAdvancedSearch(): Promise<void> {
    const dialogRef = this.dialog.open(StaffAdvancedSearchDialog, {
      width: '500px',
    });

    const criteria = await firstValueFrom(dialogRef.afterClosed());
    if (criteria) {
      this.advancedCriteria.set(criteria);
      this.pageIndex.set(0);
    }
  }

  clearAdvancedSearch(): void {
    this.advancedCriteria.set(null);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.updateQueryParams();
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set((sort.direction as 'asc' | 'desc') || 'asc');
    this.updateQueryParams();
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: `${this.sortField()},${this.sortDirection()}`,
        searchTerm: this.searchTerm() || null,
        role: this.selectedRole() || null,
        active: this.activeFilter(),
      },
      queryParamsHandling: 'merge',
    });
  }

  viewStaff(staff: StaffDto): void {
    this.router.navigate([staff.id], { relativeTo: this.route });
  }

  editStaff(staff: StaffDto): void {
    this.router.navigate([staff.id, 'edit'], { relativeTo: this.route });
  }

  async deleteStaff(staff: StaffDto): Promise<void> {
    const dialogRef = this.dialog.open(StaffDeleteConfirmDialog, {
      width: '400px',
      data: staff,
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await firstValueFrom(this.staffApi.delete(staff.id));
        this.snackBar.open('Staff member deleted successfully', 'Close', { duration: 3000 });
        // Reload the current resource
        this.staffResource.reload();
      } catch (error) {
        this.snackBar.open('Error deleting staff member', 'Close', { duration: 3000 });
      }
    }
  }

  createStaff(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}
