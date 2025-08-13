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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>history</mat-icon>
      User Activity Log
      <span class="user-info">{{ data.firstName }} {{ data.lastName }} ({{ data.username }})</span>
    </h2>

    <mat-dialog-content>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Activity Type</mat-label>
          <mat-select [(ngModel)]="selectedActivityType" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">All Activities</mat-option>
            @for (type of activityTypes; track type) {
              <mat-option [value]="type">{{ formatActivityType(type) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="selectedStatus" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="true">Success</mat-option>
            <mat-option [value]="false">Failed</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="filteredActivities()">
            <!-- Timestamp Column -->
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Time</th>
              <td mat-cell *matCellDef="let activity">
                {{ activity.timestamp | date: 'short' }}
              </td>
            </ng-container>

            <!-- Activity Type Column -->
            <ng-container matColumnDef="activityType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let activity">
                <mat-chip [color]="getActivityTypeColor(activity.activityType)" selected>
                  <mat-icon>{{ getActivityIcon(activity.activityType) }}</mat-icon>
                  {{ formatActivityType(activity.activityType) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Description Column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let activity">
                {{ activity.description }}
              </td>
            </ng-container>

            <!-- IP Address Column -->
            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef>IP Address</th>
              <td mat-cell *matCellDef="let activity">
                <code>{{ activity.ipAddress || 'N/A' }}</code>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="success">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let activity">
                @if (activity.success) {
                  <mat-icon class="success-icon" matTooltip="Success">check_circle</mat-icon>
                } @else {
                  <mat-icon class="error-icon" matTooltip="Failed">cancel</mat-icon>
                }
              </td>
            </ng-container>

            <!-- Details Column -->
            <ng-container matColumnDef="details">
              <th mat-header-cell *matHeaderCellDef>Details</th>
              <td mat-cell *matCellDef="let activity">
                @if (hasDetails(activity)) {
                  <button mat-icon-button (click)="showDetails(activity)" matTooltip="View Details">
                    <mat-icon>info</mat-icon>
                  </button>
                } @else {
                  <span class="no-details">-</span>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

            <!-- No Data Row -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [colSpan]="displayedColumns.length">
                No activity records found
              </td>
            </tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalElements()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 25, 50]"
          [pageIndex]="pageIndex()"
          (page)="onPageChange($event)"
          showFirstLastButtons
        >
        </mat-paginator>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
      <button mat-raised-button color="primary" (click)="exportActivity()">
        <mat-icon>download</mat-icon>
        Export Activity
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 28px;
          height: 28px;
          width: 28px;
        }

        .user-info {
          margin-left: auto;
          font-size: 14px;
          font-weight: normal;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      mat-dialog-content {
        width: 100%;
        min-width: 800px;
        max-height: 60vh;
        overflow-y: auto;
      }

      .filters {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;

        mat-form-field {
          width: 200px;
        }
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 40px;
      }

      .table-container {
        overflow-x: auto;
        width: 100%;

        table {
          width: 100%;
          min-width: 100%;

          code {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 2px;
          }

          .success-icon {
            color: #4caf50;
          }

          .error-icon {
            color: #f44336;
          }

          .no-details {
            color: rgba(0, 0, 0, 0.38);
          }

          .no-data {
            text-align: center;
            padding: 24px;
            font-style: italic;
            color: rgba(0, 0, 0, 0.54);
          }
        }
      }

      mat-chip {
        font-size: 11px;
        height: 24px;

        mat-icon {
          font-size: 16px;
          height: 16px;
          width: 16px;
          margin-right: 4px;
        }
      }

      mat-dialog-actions button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
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
