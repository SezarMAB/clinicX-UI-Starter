import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';
import { TenantSummaryDto } from '@features/tenants/tenants.models';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPermissionsModule } from 'ngx-permissions';

@Component({
  selector: 'app-tenant-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MtxGridModule,
    TranslateModule,
    NgxPermissionsModule,
  ],
  templateUrl: './tenant-table.component.html',
  styleUrls: ['./tenant-table.component.scss'],
})
export class TenantTableComponent {
  @Input() tenants: TenantSummaryDto[] = [];
  @Input() isLoading = false;
  @Input() totalElements = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() viewTenant = new EventEmitter<TenantSummaryDto>();
  @Output() editTenant = new EventEmitter<TenantSummaryDto>();
  @Output() deleteTenant = new EventEmitter<TenantSummaryDto>();
  @Output() toggleStatus = new EventEmitter<TenantSummaryDto>();

  columns: MtxGridColumn[] = [
    {
      header: 'tenants.table.name',
      field: 'name',
      sortable: true,
      formatter: (data: any) => `
        <div class="tenant-name">
          <strong>${data.name}</strong>
          <small class="subdomain">${data.subdomain}.clinic.com</small>
        </div>
      `,
    },
    {
      header: 'tenants.table.status',
      field: 'isActive',
      sortable: true,
      formatter: (data: any) => `
        <mat-chip class="${data.isActive ? 'status-active' : 'status-inactive'}">
          ${data.isActive ? 'ACTIVE' : 'INACTIVE'}
        </mat-chip>
      `,
    },
    {
      header: 'tenants.table.plan',
      field: 'subscriptionPlan',
      sortable: true,
      formatter: (data: any) => `
        <mat-chip class="plan-chip">${data.subscriptionPlan}</mat-chip>
      `,
    },
    {
      header: 'tenants.table.users',
      field: 'currentUsers',
      formatter: (data: any) => {
        const percentage = (data.currentUsers / data.maxUsers) * 100;
        const warningIcon =
          percentage >= 90 ? '<mat-icon class="warning-icon">warning</mat-icon>' : '';
        return `${data.currentUsers} / ${data.maxUsers} ${warningIcon}`;
      },
    },
    {
      header: 'tenants.table.created',
      field: 'createdAt',
      sortable: true,
      formatter: (data: any) => new Date(data.createdAt).toLocaleDateString(),
    },
    {
      header: 'tenants.table.actions',
      field: 'actions',
      pinned: 'right' as const,
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'visibility',
          tooltip: 'View',
          color: 'primary',
          click: (record: TenantSummaryDto) => this.viewTenant.emit(record),
        },
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: (record: TenantSummaryDto) => this.editTenant.emit(record),
        },
        {
          type: 'icon',
          icon: 'block',
          tooltip: 'Deactivate Permanently',
          color: 'warn',
          click: (record: TenantSummaryDto) => this.deleteTenant.emit(record),
        },
      ],
    },
  ];

  trackByFn(index: number, item: TenantSummaryDto): string {
    return item.id;
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSortChange(event: Sort): void {
    this.sortChange.emit(event);
  }
}
