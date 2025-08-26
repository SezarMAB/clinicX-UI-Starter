import {
  Component,
  Input,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  Injector,
  runInInjectionContext,
  EffectRef,
  Signal,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgxPermissionsModule } from 'ngx-permissions';

import { TreatmentsService } from '@features/treatments';
import { TreatmentLogDto, TreatmentStatus } from '@features/treatments/treatments.models';
import { PageRequest } from '@core/models/pagination.model';
import { TreatmentCreateDialogComponent } from '../dialogs/treatment-create-dialog/treatment-create-dialog.component';
import { TreatmentEditDialogComponent } from '../dialogs/treatment-edit-dialog/treatment-edit-dialog.component';

@Component({
  selector: 'app-treatment-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTableModule,
    MatSortModule,
    TranslateModule,
    NgxPermissionsModule,
  ],
  templateUrl: './treatment-list.component.html',
  styleUrls: ['./treatment-list.component.scss'],
})
export class TreatmentListComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() patientId?: string;
  @Input() embedded = false; // When used inside patient details

  // Services
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly injector = inject(Injector);
  private readonly cdr = inject(ChangeDetectorRef);

  // Angular Material table configuration
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<TreatmentLogDto>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Track if mobile view
  isMobile = false;

  // State signals
  readonly treatments = signal<TreatmentLogDto[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedStatus = signal<string>('');
  readonly selectedDoctor = signal('');

  // Pagination
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  // Refresh trigger for reloading data
  private readonly refreshTrigger = signal(0);

  // Patient ID as a signal for reactivity
  readonly patientIdSignal = signal<string | null>(null);

  // Filter options
  readonly statusOptions = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  // For server-side pagination, we don't filter locally
  // Instead, we'll pass filters to the API
  readonly filteredTreatments = computed(() => {
    // Return all treatments as-is for server-side pagination
    // Filtering should be done on the server
    return this.treatments();
  });

  // Get unique doctors from treatments
  readonly uniqueDoctors = computed(() => {
    const doctors = this.treatments().map(t => t.doctorName);
    return [...new Set(doctors)].sort();
  });

  readonly totalCost = computed(() =>
    this.treatments()
      .filter(t => t.status !== 'CANCELLED')
      .reduce((sum, t) => sum + (t.cost || 0), 0)
  );

  readonly completedCount = computed(
    () => this.treatments().filter(t => t.status === 'COMPLETED').length
  );

  readonly inProgressCount = computed(
    () => this.treatments().filter(t => t.status === 'IN_PROGRESS').length
  );

  readonly plannedCount = computed(
    () => this.treatments().filter(t => t.status === 'PLANNED').length
  );

  // Derived paging params - reactive to signal changes
  private readonly pageRequest = computed<PageRequest>(() => ({
    page: this.pageIndex(),
    size: this.pageSize(),
    sort: ['treatmentDate,desc'],
  }));

  constructor() {
    // Set up effect to load data when signals change
    effect(
      () => {
        const pid = this.patientIdSignal();
        const pageReq = this.pageRequest();
        const refresh = this.refreshTrigger(); // Track refresh trigger

        // Also track filter changes
        const searchTerm = this.searchTerm();
        const status = this.selectedStatus();
        const doctor = this.selectedDoctor();

        if (pid) {
          // Reset to first page when filters change
          if (searchTerm || status || doctor) {
            if (this.pageIndex() !== 0) {
              this.pageIndex.set(0);
              return; // Will trigger another effect run with page 0
            }
          }

          // Load data using observable approach to avoid reactive context issues
          this.loadTreatmentData(pid, pageReq);
        }
      },
      { allowSignalWrites: true }
    );

    // Update data source when filtered treatments change
    effect(() => {
      const filtered = this.filteredTreatments();
      this.dataSource.data = filtered;
      // Don't set paginator here - let ngAfterViewInit handle it
      // Re-apply sort after data changes
      setTimeout(() => {
        if (this.sort && this.dataSource.sort !== this.sort) {
          this.dataSource.sort = this.sort;
        }
      });
    });

    // Debug: Log treatments when they change
    effect(() => {
      const treatments = this.treatments();
      if (treatments.length > 0) {
        console.log('Current treatments data:', treatments);
        console.log('First treatment structure:', treatments[0]);
      }
    });

    // Debug: Check filtered treatments and trigger change detection
    effect(() => {
      const filtered = this.filteredTreatments();
      if (filtered.length > 0) {
        console.log('Filtered treatments for table:', filtered);
        console.log('First filtered treatment:', filtered[0]);
        // Force change detection for mat-table
        this.cdr.markForCheck();
      }
    });

    // Update paginator when total elements changes
    effect(() => {
      const total = this.totalElements();
      if (this.paginator) {
        this.paginator.length = total;
        console.log('Updated paginator length to:', total);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Normalize API response to match our expected TreatmentLogDto structure
   */
  private normalizeTreatmentFromApi = (apiRow: any): TreatmentLogDto => {
    // The API returns the exact field names as defined in the Java DTO
    console.log('=== API Treatment Row ===');
    console.log('Fields:', Object.keys(apiRow));
    console.log('Data:', apiRow);

    // Map to new structure and include legacy fields for backward compatibility
    return {
      // New field names from Java backend
      treatmentId: apiRow.treatmentId,
      treatmentDate: apiRow.treatmentDate,
      treatmentTime: apiRow.treatmentTime,
      visitType: apiRow.visitType,
      toothNumber: apiRow.toothNumber,
      treatmentName: apiRow.treatmentName,
      doctorName: apiRow.doctorName,
      durationMinutes: apiRow.durationMinutes,
      cost: apiRow.cost,
      status: apiRow.status,
      notes: apiRow.notes,
      nextAppointment: apiRow.nextAppointment,

      // Legacy field mappings for backward compatibility
      id: apiRow.treatmentId,
      patientId: apiRow.patientId,
      treatmentType: apiRow.treatmentName,
      description: apiRow.notes || apiRow.treatmentName,
      performedBy: apiRow.doctorName,
      duration: apiRow.durationMinutes,
      createdAt: apiRow.createdAt,
      updatedAt: apiRow.updatedAt,
    } as TreatmentLogDto;
  };

  private loadTreatmentData(patientId: string, pageRequest: PageRequest): void {
    console.log('loadTreatmentData called with:', { patientId, pageRequest });
    this.loading.set(true);

    // Build search criteria if filters are active
    const searchCriteria: any = {};
    const searchTerm = this.searchTerm();
    const status = this.selectedStatus();
    const doctor = this.selectedDoctor();

    if (searchTerm) {
      searchCriteria.searchTerm = searchTerm;
    }
    if (status) {
      searchCriteria.status = status;
    }
    if (doctor) {
      searchCriteria.doctorName = doctor;
    }

    // Use the observable method instead of httpResource to avoid reactive context issues
    this.treatmentsService.getPatientTreatmentHistoryObservable(patientId, pageRequest).subscribe({
      next: page => {
        if (page.content && page.content.length > 0) {
          // Normalize the API response to match our expected structure
          const normalizedTreatments = page.content.map(this.normalizeTreatmentFromApi);
          this.treatments.set(normalizedTreatments);
        } else {
          this.treatments.set([]);
        }

        // Update pagination state
        this.totalElements.set(page.totalElements || 0);

        // Update paginator if available
        if (this.paginator) {
          this.paginator.length = page.totalElements || 0;
          this.paginator.pageIndex = page.page || 0;
          this.paginator.pageSize = page.size || 10;
        }

        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error loading treatments:', error);
        console.error('Error details:', error.message, error.status);
        this.loading.set(false);

        // Set empty data on error
        this.treatments.set([]);
        this.totalElements.set(0);

        // Only load mock data if specifically needed for development
        // this.loadMockTreatments();
        this.cdr.markForCheck();
      },
    });
  }

  ngOnInit(): void {
    // Initialize table columns
    this.initializeDisplayedColumns();

    // Check for mobile on init
    this.checkScreenSize();

    // Listen for window resize
    window.addEventListener('resize', () => this.checkScreenSize());

    // Listen for language changes to update column headers
    this.translate.onLangChange.subscribe(() => {
      this.initializeDisplayedColumns();
      this.cdr.markForCheck();
    });

    // Get patient ID from route if not provided as input
    if (!this.patientId) {
      this.patientId =
        this.route.snapshot.params.patientId || this.route.parent?.snapshot.params.id;
    }

    console.log('Component initialization - Patient ID:', this.patientId);
    console.log('Route params:', this.route.snapshot.params);
    console.log('Parent route params:', this.route.parent?.snapshot.params);

    if (this.patientId) {
      // Set the patient ID signal to trigger resource loading
      this.patientIdSignal.set(this.patientId);
      console.log('Setting patientIdSignal to:', this.patientId);
    } else {
      console.warn('No patient ID found, loading mock data...');
      this.loadMockTreatments();
    }
  }

  ngAfterViewInit(): void {
    // Don't set dataSource.paginator for server-side pagination
    // We'll handle pagination manually

    if (this.sort) {
      this.dataSource.sort = this.sort;

      // Configure custom sort for specific fields
      this.dataSource.sortingDataAccessor = (data: TreatmentLogDto, sortHeaderId: string) => {
        switch (sortHeaderId) {
          case 'treatmentDate':
            return data.treatmentDate ? new Date(data.treatmentDate).getTime() : 0;
          case 'cost':
            return data.cost || 0;
          case 'durationMinutes':
            return data.durationMinutes || 0;
          case 'toothNumber':
            return data.toothNumber || '';
          case 'status':
            return data.status || '';
          default:
            return (data as any)[sortHeaderId] || '';
        }
      };

      // Trigger change detection to ensure sort arrows appear
      this.cdr.markForCheck();
    }

    // Set the total length for server-side pagination
    if (this.paginator) {
      this.paginator.length = this.totalElements();
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    // Clean up event listener
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  /**
   * Initialize table columns
   */
  private initializeDisplayedColumns(): void {
    this.displayedColumns = [
      'treatmentDate',
      'visitType',
      'treatmentName',
      'toothNumber',
      'doctorName',
      'durationMinutes',
      'cost',
      'status',
      'actions',
    ];

    // Hide columns on mobile
    if (this.isMobile) {
      this.displayedColumns = this.displayedColumns.filter(
        col => !['doctorName', 'durationMinutes'].includes(col)
      );
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
      this.updateColumnVisibility();
      this.cdr.markForCheck();
    }
  }

  /**
   * Update column visibility based on screen size
   */
  private updateColumnVisibility(): void {
    this.initializeDisplayedColumns();
  }

  // Trigger reload by incrementing refresh trigger
  loadTreatments(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  private loadMockTreatments(): void {
    console.log('Loading mock treatments...');
    // Fallback mock data matching the Java TreatmentLogDto structure
    const mockApiResponse: TreatmentLogDto[] = [
      {
        treatmentId: '1',
        treatmentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        treatmentTime: '10:00:00',
        visitType: 'Regular Checkup',
        toothNumber: 14,
        treatmentName: 'Root Canal',
        doctorName: 'Dr. John Smith',
        durationMinutes: 90,
        cost: 850,
        status: TreatmentStatus.COMPLETED,
        notes: 'Patient tolerated procedure well.',
        nextAppointment: undefined,
      },
      {
        treatmentId: '2',
        treatmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        treatmentTime: '14:30:00',
        visitType: 'Emergency',
        toothNumber: 26,
        treatmentName: 'Composite Filling',
        doctorName: 'Dr. Jane Doe',
        durationMinutes: 45,
        cost: 250,
        status: TreatmentStatus.COMPLETED,
        notes: 'Small cavity, no complications.',
        nextAppointment: undefined,
      },
      {
        treatmentId: '3',
        treatmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        treatmentTime: '09:00:00',
        visitType: 'Routine',
        toothNumber: undefined,
        treatmentName: 'Professional Cleaning',
        doctorName: 'Dr. John Smith',
        durationMinutes: 30,
        cost: 120,
        status: TreatmentStatus.COMPLETED,
        notes: undefined,
        nextAppointment: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
      {
        treatmentId: '4',
        treatmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        treatmentTime: '11:00:00',
        visitType: 'Follow-up',
        toothNumber: 18,
        treatmentName: 'Porcelain Crown',
        doctorName: 'Dr. John Smith',
        durationMinutes: 60,
        cost: 1200,
        status: TreatmentStatus.PLANNED,
        notes: 'Scheduled for next week.',
        nextAppointment: undefined,
      },
    ];

    this.treatments.set(mockApiResponse);
    this.totalElements.set(mockApiResponse.length);
    this.loading.set(false);
    console.log('Mock treatments loaded:', mockApiResponse);
    console.log('Data source after mock load:', this.dataSource.data);
    this.cdr.markForCheck();
  }

  onPageChange(event: PageEvent): void {
    console.log('Page changed:', event);
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    // The effect will automatically trigger a new data load due to pageRequest signal change
    this.cdr.markForCheck();
  }

  createTreatment(): void {
    const dialogRef = this.dialog.open(TreatmentCreateDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { patientId: this.patientId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Trigger reload by incrementing refresh trigger
        this.refreshTrigger.update(v => v + 1);
        this.toastr.success(this.translate.instant('treatments.messages.created_successfully'));
      }
    });
  }

  editTreatment(treatment: TreatmentLogDto): void {
    const dialogRef = this.dialog.open(TreatmentEditDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { treatment, patientId: this.patientId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshTrigger.update(v => v + 1);
        this.toastr.success(this.translate.instant('treatments.messages.updated_successfully'));
      }
    });
  }

  viewTreatmentDetails(treatment: TreatmentLogDto): void {
    if (this.embedded) {
      this.router.navigate(['/patients', this.patientId, 'treatments', treatment.treatmentId]);
    } else {
      this.router.navigate(['../details', treatment.treatmentId], { relativeTo: this.route });
    }
  }

  deleteTreatment(treatment: TreatmentLogDto): void {
    if (confirm(this.translate.instant('treatments.confirm_delete'))) {
      this.treatmentsService.deleteTreatment(treatment.treatmentId).subscribe({
        next: () => {
          this.refreshTrigger.update(v => v + 1);
          this.toastr.success(this.translate.instant('treatments.messages.deleted_successfully'));
        },
        error: () => {
          this.toastr.error(this.translate.instant('treatments.error.delete_failed'));
        },
      });
    }
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      PLANNED: 'primary',
      IN_PROGRESS: 'accent',
      COMPLETED: 'success',
      CANCELLED: 'warn',
    };
    return statusColors[status] || 'basic';
  }
  value = 'Clear me';
  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      PLANNED: 'schedule',
      IN_PROGRESS: 'pending',
      COMPLETED: 'check_circle',
      CANCELLED: 'cancel',
    };
    return statusIcons[status] || 'help';
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
    this.selectedDoctor.set('');
  }

  exportTreatments(): void {
    // TODO: Implement export functionality
    this.toastr.info(this.translate.instant('common.feature_coming_soon'));
  }

  /**
   * Format date to DD.MM.YYYY format
   */
  formatDate(date: string): string {
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Get status color class for styling
   */
  getStatusColorClass(status: string): string {
    const colorMap: Record<string, string> = {
      PLANNED: 'status-planned',
      IN_PROGRESS: 'status-in-progress',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
    };
    return colorMap[status] || '';
  }

  /**
   * Track by function for table rows
   */
  trackByFn = (index: number, item: TreatmentLogDto) => {
    return item.treatmentId;
  };

  /**
   * Get formatted date with time
   */
  getFormattedDateTime(date: string, time?: string): string {
    if (!date) return '-';
    const dateStr = this.formatDate(date);
    const timeStr = time ? ` ${time.substring(0, 5)}` : '';
    return dateStr + timeStr;
  }

  /**
   * Get formatted tooth number
   */
  getFormattedToothNumber(toothNumber?: number): string {
    return toothNumber ? `#${toothNumber}` : '-';
  }

  /**
   * Get formatted duration
   */
  getFormattedDuration(durationMinutes?: number): string {
    return durationMinutes != null ? `${durationMinutes} min` : '-';
  }

  /**
   * Get formatted cost
   */
  getFormattedCost(cost?: number): string {
    if (cost === null || cost === undefined) return '-';
    return this.formatCurrency(cost);
  }
}
