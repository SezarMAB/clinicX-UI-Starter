import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnChanges,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';
import { TranslateModule } from '@ngx-translate/core';
import { PageEvent } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

import { PatientSummaryDto } from '@features/patients/patients.models';

@Component({
  selector: 'app-patient-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    MtxGridModule,
    TranslateModule,
  ],
  templateUrl: './patient-table.component.html',
  styleUrls: ['./patient-table.component.css'],
})
export class PatientTableComponent implements OnChanges, OnInit, OnDestroy {
  @Input() patients: PatientSummaryDto[] = [];
  @Input() isLoading = false;
  @Input() totalElements = 0;
  @Input() pageSize = 20;
  @Input() pageIndex = 0;
  @Input() searchTerm = '';
  @Input() activeFilterCount = 0;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<any>();
  @Output() viewPatient = new EventEmitter<PatientSummaryDto>();
  @Output() editPatient = new EventEmitter<PatientSummaryDto>();

  // mtx-grid columns configuration
  columns: MtxGridColumn[] = [];

  // Track if mobile view
  isMobile = false;

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  ngOnInit() {
    // Initialize columns
    this.initializeColumns();
    // Check for mobile on init
    this.checkScreenSize();
    // Listen for window resize
    window.addEventListener('resize', () => this.checkScreenSize());

    // Listen for language changes to update column headers
    this.translate.onLangChange.subscribe(() => {
      this.initializeColumns();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    // Clean up event listener
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update change detection when inputs change
    if (changes.patients || changes.isLoading) {
      this.cdr.markForCheck();
    }
  }

  /**
   * Initialize grid columns
   */
  private initializeColumns(): void {
    this.columns = [
      {
        header: this.translate.instant('patients.table.id'),
        field: 'publicFacingId',
        sortable: true,
        minWidth: 80,
        hide: false,
      },
      {
        header: this.translate.instant('patients.table.full_name'),
        field: 'fullName',
        sortable: true,
        minWidth: 150,
        formatter: (data: any) => {
          const hasAlert = data.hasAlert;
          if (hasAlert) {
            return `<strong>${data.fullName}</strong> <mat-icon class="text-orange" style="font-size: 16px; vertical-align: middle;">warning</mat-icon>`;
          }
          return `<strong>${data.fullName}</strong>`;
        },
      },
      {
        header: this.translate.instant('patients.table.date_of_birth'),
        field: 'dateOfBirth',
        sortable: true,
        minWidth: 120,
        hide: this.isMobile,
        formatter: (data: any) => this.formatDate(data.dateOfBirth),
      },
      {
        header: this.translate.instant('patients.table.age'),
        field: 'age',
        sortable: false, // Age is calculated in backend, cannot sort directly
        minWidth: 80,
        hide: this.isMobile,
        formatter: (data: any) => `${data.age} ${this.translate.instant('patients.table.years')}`,
      },
      {
        header: this.translate.instant('patients.table.gender'),
        field: 'gender',
        sortable: true,
        minWidth: 100,
        hide: this.isMobile,
        formatter: (data: any) => {
          const symbol = this.getGenderSymbol(data.gender);
          const colorClass =
            data.gender === 'M' || data.gender === 'Male'
              ? 'male'
              : data.gender === 'F' || data.gender === 'Female'
                ? 'female'
                : '';
          return `<span class="gender-symbol ${colorClass}">${symbol}</span> ${data.gender}`;
        },
      },
      {
        header: this.translate.instant('patients.table.phone'),
        field: 'phoneNumber',
        minWidth: 120,
        formatter: (data: any) => {
          return data.phoneNumber
            ? `<a href="tel:${data.phoneNumber}" class="text-primary">${data.phoneNumber}</a>`
            : '-';
        },
      },
      {
        header: this.translate.instant('patients.table.email'),
        field: 'email',
        minWidth: 180,
        hide: this.isMobile,
        formatter: (data: any) => {
          return data.email
            ? `<a href="mailto:${data.email}" class="text-primary">${data.email}</a>`
            : '-';
        },
      },
      {
        header: this.translate.instant('patients.table.balance'),
        field: 'balance',
        sortable: true,
        minWidth: 100,
        formatter: (data: any) => {
          const colorClass = data.balance >= 0 ? 'text-green' : 'text-red';
          return `<span class="${colorClass}">${this.formatBalance(data.balance)}</span>`;
        },
      },
      {
        header: this.translate.instant('patients.table.alert'),
        field: 'hasAlert',
        sortable: true,
        minWidth: 80,
        hide: this.isMobile,
        formatter: (data: any) => {
          return data.hasAlert
            ? '<mat-icon class="text-orange">warning</mat-icon>'
            : '<mat-icon class="text-grey">check_circle</mat-icon>';
        },
      },
      {
        header: this.translate.instant('patients.table.actions'),
        field: 'actions',
        minWidth: 120,
        width: '120px',
        pinned: 'right',
        type: 'button',
        buttons: [
          {
            type: 'icon',
            icon: 'visibility',
            tooltip: this.translate.instant('patients.table.view_patient_details'),
            color: 'primary',
            click: (record: PatientSummaryDto) => this.onViewPatient(record),
          },
          // {
          //   type: 'icon',
          //   icon: 'edit',
          //   tooltip: this.translate.instant('patients.table.edit'),
          //   click: (record: PatientSummaryDto) => this.onEditPatient(record),
          // },
          {
            type: 'icon',
            icon: 'more_vert',
            tooltip: this.translate.instant('patients.table.more_actions'),
            click: (record: PatientSummaryDto) => {
              // Menu will be handled differently in mtx-grid
              console.log('More actions for', record);
            },
          },
        ],
      },
    ];
  }

  /**
   * Check screen size and adjust columns
   */
  private checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;

    // Only update columns if screen size category changed
    if (wasMobile !== this.isMobile) {
      this.updateColumnVisibility();
      this.cdr.markForCheck();
    }
  }

  /**
   * Update column visibility based on screen size
   */
  private updateColumnVisibility(): void {
    const hiddenOnMobile = ['dateOfBirth', 'age', 'gender', 'email', 'hasAlert'];

    this.columns = this.columns.map(col => {
      if (hiddenOnMobile.includes(col.field as string)) {
        return { ...col, hide: this.isMobile };
      }
      return col;
    });
  }

  /**
   * Handles pagination changes
   */
  onPageChange(event: any): void {
    // Convert mtx-grid page event to Angular Material PageEvent format
    const pageEvent: PageEvent = {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      length: this.totalElements,
      previousPageIndex: this.pageIndex,
    };
    this.pageChange.emit(pageEvent);
    this.cdr.markForCheck();
  }

  /**
   * Handles sort changes
   */
  onSortChange(sort: any): void {
    // Convert mtx-grid sort to Angular Material Sort format
    const materialSort = {
      active: sort.active,
      direction: sort.direction || '',
    };
    this.sortChange.emit(materialSort);
    this.cdr.markForCheck();
  }

  /**
   * Views patient details
   */
  onViewPatient(patient: PatientSummaryDto): void {
    this.viewPatient.emit(patient);
  }

  /**
   * Edits patient information
   */
  onEditPatient(patient: PatientSummaryDto): void {
    this.editPatient.emit(patient);
  }

  /**
   * Formats the balance display
   */
  formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance);
  }

  /**
   * Formats date to DD.MM.YYYY format
   */
  formatDate(date: string): string {
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Gets the gender symbol (Mars/Venus)
   */
  getGenderSymbol(gender: string | undefined): string {
    switch (gender?.toLowerCase()) {
      case 'male':
      case 'm':
        return '♂'; // Mars symbol for male
      case 'female':
      case 'f':
        return '♀'; // Venus symbol for female
      default:
        return '⚥'; // Combined symbol for other/unknown
    }
  }

  /**
   * Track by function for grid rows
   */
  trackByFn = (index: number, item: PatientSummaryDto) => {
    return item.id;
  };
}
