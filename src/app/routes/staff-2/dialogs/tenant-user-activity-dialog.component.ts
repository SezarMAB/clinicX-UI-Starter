import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import {
  TenantUserDto,
  UserActivityDto,
  ActivityType,
} from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './tenant-user-activity-dialog.component.html',
  styleUrls: ['./tenant-user-activity-dialog.component.scss'],
})
export class TenantUserActivityDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TenantUserActivityDialogComponent>);
  private tenantUserService = inject(TenantUserManagementService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  displayedColumns = [
    'timestamp',
    'activityType',
    'description',
    'ipAddress',
    'success',
    'details',
  ];
  activityTypes = Object.values(ActivityType);

  // Signals
  isLoading = signal(false);
  activities = signal<UserActivityDto[]>([]);
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  // Filters
  selectedActivityType: ActivityType | null = null;
  selectedStatus: boolean | null = null;

  // Computed filtered activities
  filteredActivities = computed(() => {
    let filtered = this.activities();

    if (this.selectedActivityType) {
      filtered = filtered.filter(a => a.activityType === this.selectedActivityType);
    }

    if (this.selectedStatus !== null) {
      filtered = filtered.filter(a => a.success === this.selectedStatus);
    }

    return filtered;
  });

  // Resource for fetching activity
  activityResource = this.tenantUserService.getUserActivity(
    signal(this.data.userId!),
    computed(() => ({
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: ['timestamp,desc'],
    }))
  );

  constructor() {
    // Watch for data changes
    effect(() => {
      this.isLoading.set(this.activityResource.isLoading());

      const data = this.activityResource.value();
      if (data) {
        this.activities.set([...(data.content || [])]);
        this.totalElements.set(data.totalElements || 0);
      }
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect
  }

  formatActivityType(type?: string): string {
    if (!type) return '';
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getActivityTypeColor(type?: ActivityType): string {
    switch (type) {
      case ActivityType.LOGIN:
      case ActivityType.LOGOUT:
        return 'primary';
      case ActivityType.PASSWORD_CHANGE:
      case ActivityType.PASSWORD_RESET:
      case ActivityType.ROLE_CHANGE:
        return 'accent';
      case ActivityType.FAILED_LOGIN:
      case ActivityType.ACCOUNT_LOCKED:
      case ActivityType.PERMISSION_DENIED:
        return 'warn';
      default:
        return '';
    }
  }

  getActivityIcon(type?: ActivityType): string {
    switch (type) {
      case ActivityType.LOGIN:
        return 'login';
      case ActivityType.LOGOUT:
        return 'logout';
      case ActivityType.PASSWORD_CHANGE:
        return 'password';
      case ActivityType.PASSWORD_RESET:
        return 'lock_reset';
      case ActivityType.ACCOUNT_LOCKED:
        return 'lock';
      case ActivityType.ACCOUNT_UNLOCKED:
        return 'lock_open';
      case ActivityType.ROLE_CHANGE:
        return 'admin_panel_settings';
      case ActivityType.PROFILE_UPDATE:
        return 'person';
      case ActivityType.TENANT_SWITCH:
        return 'business';
      case ActivityType.ACCESS_GRANTED:
        return 'check_circle';
      case ActivityType.ACCESS_REVOKED:
        return 'block';
      case ActivityType.FAILED_LOGIN:
        return 'error';
      case ActivityType.PERMISSION_DENIED:
        return 'block';
      case ActivityType.DATA_ACCESS:
        return 'visibility';
      case ActivityType.DATA_MODIFICATION:
        return 'edit';
      case ActivityType.EXPORT_DATA:
        return 'download';
      case ActivityType.API_ACCESS:
        return 'api';
      default:
        return 'event';
    }
  }

  onFilterChange(): void {
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  hasDetails(activity: UserActivityDto): boolean {
    return !!(activity.details && Object.keys(activity.details).length > 0);
  }

  showDetails(activity: UserActivityDto): void {
    // Could open a dialog or expand details
    console.log('Activity details:', activity.details);
  }

  exportActivity(): void {
    // Implement CSV export
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${this.data.username}-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generateCSV(): string {
    const headers = ['Timestamp', 'Type', 'Description', 'IP Address', 'Status'];
    const rows = this.filteredActivities().map(a => [
      a.timestamp,
      a.activityType,
      a.description,
      a.ipAddress || 'N/A',
      a.success ? 'Success' : 'Failed',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
