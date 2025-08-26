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
  ViewChild,
  AfterViewInit,
  DestroyRef,
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgxPermissionsModule } from 'ngx-permissions';

import { TreatmentsService } from '@features/treatments';
import { TreatmentLogDto, TreatmentStatus } from '@features/treatments/treatments.models';
import { PageRequest } from '@core/models/pagination.model';
import { TreatmentCreateDialogComponent } from '../dialogs/treatment-create-dialog/treatment-create-dialog.component';
import { TreatmentEditDialogComponent } from '../dialogs/treatment-edit-dialog/treatment-edit-dialog.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { fromEvent, debounceTime, distinctUntilChanged, skip } from 'rxjs';

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
    MatProgressBarModule,
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
    TreatmentCreateDialogComponent,
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

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
  readonly isPaginating = signal(false); // Separate state for pagination
  readonly searchTerm = signal('');
  readonly selectedStatus = signal<string>('');
  readonly selectedDoctor = signal('');
  readonly showCreate = signal(false);

  // Track if this is the initial load
  private isInitialLoad = true;

  // Prevent circular API calls
  private isLoadingData = false;

  // Pagination
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  // Sorting (server-side)
  readonly sortActive = signal<string>('visitDate');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

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
    const doctors = this.treatments()
      .map(t => t.doctorName)
      .filter(Boolean) as string[];
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
    sort: [`${this.sortActive()},${this.sortDirection()}`],
  }));

  constructor() {
    // Simple effect for initial load only
    let isFirstLoad = true;
    effect(() => {
      const pid = this.patientIdSignal();
      const refresh = this.refreshTrigger();

      if (pid && isFirstLoad) {
        isFirstLoad = false;
        this.loadTreatmentData(pid, this.pageRequest());
      } else if (refresh > 0 && pid) {
        // Handle manual refresh
        this.loadTreatmentData(pid, this.pageRequest());
      }
    });

    // Immediate effect for status/doctor filter changes (search debounced separately)
    let prevNonSearchFilters = '';
    effect(() => {
      const status = this.selectedStatus();
      const doctor = this.selectedDoctor();
      const pid = this.patientIdSignal();

      const current = `${status}|${doctor}`;
      if (!this.isInitialLoad && pid && current !== prevNonSearchFilters) {
        prevNonSearchFilters = current;
        // Reset to first page when non-search filters change
        this.pageIndex.set(0);
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadTreatmentData(pid, this.pageRequest());
      }
    });

    // Debounced search term changes
    toObservable(this.searchTerm)
      .pipe(debounceTime(300), distinctUntilChanged(), skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const pid = this.patientIdSignal();
        if (!this.isInitialLoad && pid) {
          this.pageIndex.set(0);
          if (this.paginator) this.paginator.pageIndex = 0;
          this.loadTreatmentData(pid, this.pageRequest());
        }
      });

    // Update data source when filtered treatments change
    effect(() => {
      const filtered = this.filteredTreatments();
      // Smart update - only replace data if content has changed
      const hasDataChanged = this.hasDataChanged(this.dataSource.data, filtered);

      if (hasDataChanged) {
        // Preserve selection and scroll position during update
        this.updateDataSourceSmartly(filtered);
      }
    });

    // Keep paginator in sync via binding; avoid imperative assignment
  }

  /**
   * Normalize API response to match our expected TreatmentLogDto structure
   */
  private normalizeTreatmentFromApi = (apiRow: any): TreatmentLogDto => {
    // The API returns the exact field names as defined in the Java DTO

    // Map to new structure and include legacy fields for backward compatibility
    return {
      // New field names from Java backend
      visitId: apiRow.visitId,
      visitDate: apiRow.visitDate,
      visitTime: apiRow.visitTime,
      visitType: apiRow.visitType,
      toothNumber: apiRow.toothNumber,
      visitName: apiRow.visitName,
      doctorName: apiRow.doctorName,
      durationMinutes: apiRow.durationMinutes,
      cost: apiRow.cost,
      status: apiRow.status,
      notes: apiRow.notes,
      nextAppointment: apiRow.nextAppointment,

      // Legacy field mappings for backward compatibility
      id: apiRow.visitId,
      patientId: apiRow.patientId,
      treatmentType: apiRow.visitName,
      description: apiRow.notes || apiRow.visitName,
      performedBy: apiRow.doctorName,
      duration: apiRow.durationMinutes,
      createdAt: apiRow.createdAt,
      updatedAt: apiRow.updatedAt,
    } as TreatmentLogDto;
  };

  private loadTreatmentData(patientId: string, pageRequest: PageRequest): void {
    // Prevent concurrent loads
    if (this.isLoadingData) {
      return;
    }

    this.isLoadingData = true;

    // Determine if this is pagination or initial load
    const isPagination = !this.isInitialLoad && this.treatments().length > 0;

    // Only show loading spinner on initial load
    if (isPagination) {
      this.isPaginating.set(true);
    } else {
      this.loading.set(true);
    }

    // Choose endpoint: when any filter/search is active, use search API; otherwise use history
    const hasFilters = !!(this.searchTerm() || this.selectedStatus() || this.selectedDoctor());
    const fetch$ = hasFilters
      ? this.treatmentsService.searchTreatments(
          {
            patientId,
            treatmentType: this.searchTerm() || undefined,
            status: this.selectedStatus() || undefined,
            performedBy: this.selectedDoctor() || undefined,
          },
          pageRequest
        )
      : this.treatmentsService.getPatientTreatmentHistoryObservable(patientId, pageRequest);

    fetch$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        // Smooth transition for pagination
        requestAnimationFrame(() => {
          if (page.content && page.content.length > 0) {
            // Normalize the API response to match our expected structure
            const normalizedTreatments = page.content.map(this.normalizeTreatmentFromApi);
            this.treatments.set(normalizedTreatments);
          } else {
            this.treatments.set([]);
          }

          // Update pagination state
          this.totalElements.set(page.totalElements || 0);

          // Clear loading states
          this.loading.set(false);
          this.isPaginating.set(false);
          this.isInitialLoad = false;
          this.isLoadingData = false;
          this.cdr.markForCheck();
        });
      },
      error: error => {
        console.error('Error loading treatments:', error);
        console.error('Error details:', error.message, error.status);

        // Clear loading states
        this.loading.set(false);
        this.isPaginating.set(false);
        this.isInitialLoad = false;
        this.isLoadingData = false;

        // Set empty data on error
        this.treatments.set([]);
        this.totalElements.set(0);

        this.cdr.markForCheck();
      },
    });
  }

  ngOnInit(): void {
    // Initialize table columns
    this.initializeDisplayedColumns();

    // Check for mobile on init
    this.checkScreenSize();

    // Listen for language changes to update column headers
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.initializeDisplayedColumns();
      this.cdr.markForCheck();
    });

    // Get patient ID from route if not provided as input
    if (!this.patientId) {
      this.patientId =
        this.route.snapshot.params.patientId || this.route.parent?.snapshot.params.id;
    }

    if (this.patientId) {
      // Set the patient ID signal to trigger resource loading
      this.patientIdSignal.set(this.patientId);
    } else {
      this.loadMockTreatments();
    }
  }

  ngAfterViewInit(): void {
    // Don't set dataSource.paginator for server-side pagination
    // We'll handle pagination manually

    // Hook window resize via RxJS and auto-cleanup
    fromEvent(window, 'resize')
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    // Subscriptions auto-cleaned via takeUntilDestroyed
  }

  /**
   * Initialize table columns
   */
  private initializeDisplayedColumns(): void {
    this.displayedColumns = [
      'visitDate',
      'visitType',
      'visitName',
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
    // Fallback mock data matching the Java TreatmentLogDto structure
    const mockApiResponse: TreatmentLogDto[] = [
      {
        visitId: '1',
        visitDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        visitTime: '10:00:00',
        visitType: 'Regular Checkup',
        toothNumber: 14,
        visitName: 'Root Canal',
        doctorName: 'Dr. John Smith',
        durationMinutes: 90,
        cost: 850,
        status: TreatmentStatus.COMPLETED,
        notes: 'Patient tolerated procedure well.',
        nextAppointment: undefined,
      },
      {
        visitId: '2',
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visitTime: '14:30:00',
        visitType: 'Emergency',
        toothNumber: 26,
        visitName: 'Composite Filling',
        doctorName: 'Dr. Jane Doe',
        durationMinutes: 45,
        cost: 250,
        status: TreatmentStatus.COMPLETED,
        notes: 'Small cavity, no complications.',
        nextAppointment: undefined,
      },
      {
        visitId: '3',
        visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visitTime: '09:00:00',
        visitType: 'Routine',
        toothNumber: undefined,
        visitName: 'Professional Cleaning',
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
        visitId: '4',
        visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visitTime: '11:00:00',
        visitType: 'Follow-up',
        toothNumber: 18,
        visitName: 'Porcelain Crown',
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
    this.cdr.markForCheck();
  }

  onPageChange(event: PageEvent): void {
    // Don't process if already loading
    if (this.isLoadingData) {
      return;
    }

    // Check if anything actually changed
    const pageChanged = event.pageIndex !== this.pageIndex();
    const sizeChanged = event.pageSize !== this.pageSize();

    if (!pageChanged && !sizeChanged) {
      return;
    }

    // Update local state
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    // Load new page data
    const pid = this.patientIdSignal();
    if (pid) {
      this.loadTreatmentData(pid, this.pageRequest());
    }
  }

  createTreatment(): void {
    // Switch to inline create view instead of opening a dialog
    this.showCreate.set(true);
  }

  onCreateSaved(_: unknown): void {
    // Return to list view and refresh
    this.showCreate.set(false);
    this.refreshTrigger.update(v => v + 1);
    this.toastr.success(this.translate.instant('treatments.messages.created_successfully'));
  }

  onCreateCanceled(): void {
    this.showCreate.set(false);
  }

  editTreatment(treatment: TreatmentLogDto): void {
    const dialogRef = this.dialog.open(TreatmentEditDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { treatment, patientId: this.patientId },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.refreshTrigger.update(v => v + 1);
          this.toastr.success(this.translate.instant('treatments.messages.updated_successfully'));
        }
      });
  }

  viewTreatmentDetails(treatment: TreatmentLogDto): void {
    if (this.embedded) {
      this.router.navigate(['/patients', this.patientId, 'treatments', treatment.visitId]);
    } else {
      this.router.navigate(['../details', treatment.visitId], { relativeTo: this.route });
    }
  }

  deleteTreatment(treatment: TreatmentLogDto): void {
    if (confirm(this.translate.instant('treatments.confirm_delete'))) {
      this.treatmentsService
        .deleteTreatment(treatment.visitId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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

  // Removed unused getStatusColor and stray component value
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
    // Safe parse for YYYY-MM-DD without timezone shifts
    const [y, m, d] = date.split('-').map(n => parseInt(n, 10));
    const day = d.toString().padStart(2, '0');
    const month = m.toString().padStart(2, '0');
    const year = y;
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
    return item.visitId;
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

  /**
   * Check if data has actually changed (not just reference)
   */
  private hasDataChanged(oldData: TreatmentLogDto[], newData: TreatmentLogDto[]): boolean {
    if (oldData.length !== newData.length) return true;
    const fp = (t: TreatmentLogDto) => `${t.visitId}|${t.status}|${t.cost}|${t.updatedAt ?? ''}`;
    const oldFp = oldData.map(fp).join(',');
    const newFp = newData.map(fp).join(',');
    return oldFp !== newFp;
  }

  /**
   * Smart update of data source to prevent flicker
   */
  private updateDataSourceSmartly(newData: TreatmentLogDto[]): void {
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      // Update data without recreating the entire table
      this.dataSource.data = newData;

      // Trigger change detection
      this.cdr.markForCheck();
    });
  }

  onSortChange(event: Sort): void {
    const dir = (event.direction || 'asc') as 'asc' | 'desc';
    const active = event.active || 'visitDate';
    const changed = active !== this.sortActive() || dir !== this.sortDirection();
    if (!changed) return;
    this.sortActive.set(active);
    this.sortDirection.set(dir || 'asc');
    this.pageIndex.set(0);
    if (this.paginator) this.paginator.pageIndex = 0;
    const pid = this.patientIdSignal();
    if (pid) this.loadTreatmentData(pid, this.pageRequest());
  }
}
