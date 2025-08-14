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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject, firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import {
  TenantUserDto,
  UserType,
  PageTenantUserDto,
} from '../../../features/tenant-user-management/tenant-user-management.models';
import { PageRequest } from '../../../core/models/pagination.model';
import { TenantUserViewDialogComponent } from '../dialogs/tenant-user-view-dialog.component';
import { TenantUserEditDialogComponent } from '../dialogs/tenant-user-edit-dialog.component';
import { TenantUserCreateDialogComponent } from '../dialogs/tenant-user-create-dialog.component';
import { TenantUserRolesDialogComponent } from '../dialogs/tenant-user-roles-dialog.component';
import { TenantUserPasswordDialogComponent } from '../dialogs/tenant-user-password-dialog.component';
import { TenantUserActivityDialogComponent } from '../dialogs/tenant-user-activity-dialog.component';
import { GrantExternalAccessDialogComponent } from '../dialogs/grant-external-access-dialog.component';
import { TenantUserDeleteConfirmDialog } from '../shared/tenant-user-delete-confirm.dialog';
import { TenantUserAdvancedSearchDialog } from '../dialogs/tenant-user-advanced-search.dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-staff-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
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
    MatMenuModule,
    MatDividerModule,
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
  private readonly tenantUserService = inject(TenantUserManagementService);

  // Table columns
  readonly displayedColumns = [
    'username',
    'fullName',
    'email',
    'roles',
    'userType',
    'enabled',
    'actions',
  ];

  // User types
  readonly userTypes = Object.values(UserType);

  // Loading state
  isLoading = signal(false);

  // Search functionality
  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  // Filters
  includeExternal = signal(true);
  selectedUserType = signal<UserType | null>(null);
  enabledFilter = signal<boolean | null>(null);
  showAdvancedFilters = signal(false);

  // User data
  userData = signal<TenantUserDto[]>([]);

  // Pagination state
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  sortField = signal<string>('username');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Track if we're in search mode
  isSearchMode = signal(false);

  // Computed signals
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedUserType() !== null) count++;
    if (this.enabledFilter() !== null) count++;
    if (!this.includeExternal()) count++;
    return count;
  });

  pageRequest = computed<PageRequest>(() => {
    const sort = this.sortField();
    return {
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: sort ? [`${sort},${this.sortDirection()}`] : ['username,asc'],
    };
  });

  // Resources from service - create them once with signals
  private includeExternalSignal = computed(() => this.includeExternal());
  private searchTermSignal = computed(() => this.searchTerm());

  // Create the main users resource with pagination
  usersResource = this.tenantUserService.getAllUsers(this.includeExternalSignal, this.pageRequest);

  // Create search resource - only used when searching
  searchResource = this.tenantUserService.searchUsers(this.searchTermSignal);

  constructor() {
    // Subscribe to search changes with debounce
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.isSearchMode.set(!!searchTerm); // Enable search mode when there's a search term
      this.pageIndex.set(0);
    });

    // Watch for data changes from the appropriate resource
    effect(() => {
      const resource = this.isSearchMode() ? this.searchResource : this.usersResource;

      this.isLoading.set(resource.isLoading());

      if (resource.error()) {
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
      }

      const data = resource.value();
      if (data) {
        this.userData.set([...(data.content || [])]);
        this.totalElements.set(data.totalElements || 0);
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
    if (params.searchTerm) {
      this.searchTerm.set(params.searchTerm);
      this.isSearchMode.set(true);
    }
    if (params.includeExternal !== undefined) {
      this.includeExternal.set(params.includeExternal === 'true');
    }
    if (params.userType) this.selectedUserType.set(params.userType as UserType);
    if (params.enabled !== undefined) this.enabledFilter.set(params.enabled === 'true');
  }

  onSearchValueChange(value: string): void {
    this.searchSubject.next(value);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.isSearchMode.set(false);
    this.selectedUserType.set(null);
    this.enabledFilter.set(null);
    this.includeExternal.set(true);
    this.pageIndex.set(0);
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.updateQueryParams();
    this.refreshData();
  }

  async openAdvancedSearch(): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserAdvancedSearchDialog, {
      width: '600px',
      data: {
        searchTerm: this.searchTerm(),
        userType: this.selectedUserType(),
        enabled: this.enabledFilter(),
        includeExternal: this.includeExternal(),
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.searchTerm.set(result.searchTerm || '');
      this.selectedUserType.set(result.userType || null);
      this.enabledFilter.set(result.enabled ?? null);
      this.includeExternal.set(result.includeExternal ?? true);
      this.pageIndex.set(0);
      this.refreshData();
    }
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
        includeExternal: this.includeExternal(),
        userType: this.selectedUserType() || null,
        enabled: this.enabledFilter(),
      },
      queryParamsHandling: 'merge',
    });
  }

  private refreshData(): void {
    if (this.isSearchMode()) {
      this.searchResource.reload();
    } else {
      this.usersResource.reload();
    }
  }

  async viewUser(user: TenantUserDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserViewDialogComponent, {
      width: '700px',
      data: user,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    // Handle actions from View Details dialog
    if (result?.action === 'edit' && result?.user) {
      await this.editUser(result.user);
    } else if (result?.action === 'resetPassword' && result?.user) {
      await this.resetPassword(result.user);
    } else if (result?.updated) {
      this.refreshData();
    }
  }

  async editUser(user: TenantUserDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserEditDialogComponent, {
      width: '700px',
      data: user,
      disableClose: true,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
      this.refreshData();
    }
  }

  async createUser(): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserCreateDialogComponent, {
      width: '700px',
      disableClose: true,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
      this.refreshData();
    }
  }

  async manageRoles(user: TenantUserDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserRolesDialogComponent, {
      width: '500px',
      data: user,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.snackBar.open('User roles updated successfully', 'Close', { duration: 3000 });
      this.refreshData();
    }
  }

  async resetPassword(user: TenantUserDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserPasswordDialogComponent, {
      width: '500px',
      data: user,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.snackBar.open('Password reset successfully', 'Close', { duration: 3000 });
    }
  }

  async viewActivity(user: TenantUserDto): Promise<void> {
    this.dialog.open(TenantUserActivityDialogComponent, {
      width: '90vw',
      height: '75vh',
      maxWidth: '95vw',
      data: user,
    });
  }

  async toggleUserStatus(user: TenantUserDto): Promise<void> {
    try {
      if (user.enabled) {
        await firstValueFrom(this.tenantUserService.deactivateUser(user.userId!));
        this.snackBar.open('User deactivated successfully', 'Close', { duration: 3000 });
      } else {
        await firstValueFrom(this.tenantUserService.activateUser(user.userId!));
        this.snackBar.open('User activated successfully', 'Close', { duration: 3000 });
      }
      this.refreshData();
    } catch (error) {
      this.snackBar.open('Error updating user status', 'Close', { duration: 3000 });
    }
  }

  async deleteUser(user: TenantUserDto): Promise<void> {
    const dialogRef = this.dialog.open(TenantUserDeleteConfirmDialog, {
      width: '400px',
      data: user,
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await firstValueFrom(this.tenantUserService.deleteUser(user.userId!));
        this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        this.refreshData();
      } catch (error) {
        this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
      }
    }
  }

  async grantExternalAccess(): Promise<void> {
    const dialogRef = this.dialog.open(GrantExternalAccessDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.snackBar.open('External access granted successfully', 'Close', { duration: 3000 });
      this.refreshData();
    }
  }

  async revokeExternalAccess(user: TenantUserDto): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(TenantUserDeleteConfirmDialog, {
          width: '400px',
          data: {
            ...user,
            message: `Are you sure you want to revoke external access for ${user.username}?`,
          },
        })
        .afterClosed()
    );

    if (confirmed) {
      try {
        await firstValueFrom(this.tenantUserService.revokeExternalUserAccess(user.userId!));
        this.snackBar.open('External access revoked successfully', 'Close', { duration: 3000 });
        this.refreshData();
      } catch (error) {
        this.snackBar.open('Error revoking external access', 'Close', { duration: 3000 });
      }
    }
  }

  getUserTypeColor(userType?: UserType | any): string {
    if (!userType) return '';

    // Handle UserType enum values
    if (userType === 'INTERNAL' || userType === UserType.INTERNAL) {
      return 'primary';
    }
    if (userType === 'EXTERNAL' || userType === UserType.EXTERNAL) {
      return 'accent';
    }
    if (userType === 'SUPER_ADMIN' || userType === UserType.SUPER_ADMIN) {
      return 'warn';
    }

    // Handle StaffRole values
    if (userType === 'ADMIN') return 'warn';
    if (userType === 'DOCTOR') return 'primary';
    if (userType === 'NURSE') return 'accent';

    return '';
  }

  getRoleBadgeColor(role: string): string {
    if (role.includes('ADMIN')) return 'warn';
    if (role.includes('DOCTOR')) return 'primary';
    if (role.includes('NURSE')) return 'accent';
    return '';
  }
}
