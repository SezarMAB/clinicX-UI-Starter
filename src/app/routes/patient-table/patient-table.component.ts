import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  inject,
  OnChanges,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

import { PatientSummaryDto } from '@features/patients/patients.models';

@Component({
  selector: 'app-patient-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
  ],
  templateUrl: './patient-table.component.html',
  styleUrls: ['./patient-table.component.css'],
})
export class PatientTableComponent implements OnChanges, OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input() patients: PatientSummaryDto[] = [];
  @Input() isLoading = false;
  @Input() totalElements = 0;
  @Input() pageSize = 20;
  @Input() pageIndex = 0;
  @Input() searchTerm = '';
  @Input() activeFilterCount = 0;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() viewPatient = new EventEmitter<PatientSummaryDto>();
  @Output() editPatient = new EventEmitter<PatientSummaryDto>();

  // Table configuration - Desktop columns
  private readonly desktopColumns: string[] = [
    'publicFacingId',
    'fullName',
    'dateOfBirth',
    'age',
    'gender',
    'phoneNumber',
    'email',
    'balance',
    'hasAlert',
    'view',
    'actions',
  ];

  // Mobile columns configuration
  private readonly mobileColumns: string[] = ['fullName', 'phoneNumber', 'balance', 'actions'];

  // Current displayed columns
  displayedColumns: string[] = this.desktopColumns;

  // Track if mobile view
  isMobile = false;

  // Data source for the table
  dataSource = new MatTableDataSource<PatientSummaryDto>([]);

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // Check for mobile on init
    this.checkScreenSize();
    // Listen for window resize
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy() {
    // Clean up event listener
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  ngOnChanges() {
    // Update data source when patients input changes
    if (this.patients !== this.dataSource.data) {
      this.dataSource.data = this.patients;
      this.cdr.markForCheck();
    }
  }

  /**
   * Check screen size and adjust columns
   */
  private checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;

    // Only update columns if screen size category changed
    if (wasMobile !== this.isMobile) {
      this.displayedColumns = this.isMobile ? [...this.mobileColumns] : [...this.desktopColumns];
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles pagination changes
   */
  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
    this.cdr.markForCheck();
  }

  /**
   * Handles sort changes
   */
  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
    this.cdr.markForCheck();
  }

  /**
   * Views patient details
   */
  onViewPatient(patient: PatientSummaryDto): void {
    this.viewPatient.emit(patient);
    this.router.navigate(['/patient', patient.id]);
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
   * TrackBy function for table rows
   */
  trackByPatientId(index: number, patient: PatientSummaryDto): string {
    return patient.id;
  }
}
