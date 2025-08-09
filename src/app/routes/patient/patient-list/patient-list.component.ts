import {
  Component,
  OnInit,
  ViewChild,
  signal,
  computed,
  inject,
  ChangeDetectorRef,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { BreadcrumbComponent, AdvancedSearchFilterComponent } from '@shared';

import { PatientsService } from '@features/patients';
import {
  PatientSummaryDto,
  PatientSearchCriteria,
  Gender,
} from '@features/patients/patients.models';
import { PageRequest } from '@core/models/pagination.model';
import { PatientTableComponent } from '../patient-table/patient-table.component';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxPermissionsModule } from 'ngx-permissions';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatCardModule,
    PatientTableComponent,
    MatBadgeModule,
    TranslateModule,
    AdvancedSearchFilterComponent,
    NgxPermissionsModule,
  ],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
})
export class PatientListComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Loading state
  isLoading = signal(false);

  // Search functionality
  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  // Advanced search criteria
  showAdvancedFilters = signal(false);
  balanceFrom = signal<number | null>(null);
  balanceTo = signal<number | null>(null);
  balanceType = signal<string>(''); // 'all', 'negative', 'positive'
  selectedGender = signal<Gender>('');
  isActive = signal<boolean>(false);
  hasMedicalNotes = signal<boolean | null>(false);
  hasAppointments = signal<boolean | null>(false);
  hasTreatments = signal<boolean | null>(false);

  // Patient data
  patients = signal<PatientSummaryDto[]>([]);

  // Pagination state
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  // Sort state
  sortField = signal('fullName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Computed active filter count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.balanceFrom() !== null) count++;
    if (this.balanceTo() !== null) count++;
    if (this.balanceType() && this.balanceType() !== '') count++;
    if (this.selectedGender()) count++;
    if (this.isActive()) count++;
    if (this.hasMedicalNotes() === true) count++;
    if (this.hasAppointments() === true) count++;
    if (this.hasTreatments() === true) count++;
    return count;
  });

  // Computed pagination params
  private pageable = computed<PageRequest>(() => ({
    page: this.pageIndex(),
    size: this.pageSize(),
    sort: [`${this.sortField()},${this.sortDirection()}`],
  }));

  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    // Set up search debouncing
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.pageIndex.set(0); // Reset to first page on new search
      this.searchPatients();
    });

    // Initial load
    this.searchPatients();
  }

  /**
   * Handles search value changes using ngModel
   */
  onSearchValueChange(value: string): void {
    // Trigger debounced search
    this.searchSubject.next(value);
  }

  /**
   * Searches for patients using the search criteria
   */
  searchPatients(): void {
    this.isLoading.set(true);

    const searchCriteria: PatientSearchCriteria = {
      searchTerm: this.searchTerm() || undefined,
      balanceFrom: this.balanceFrom() ?? undefined,
      balanceTo: this.balanceTo() ?? undefined,
      isBalanceNegative:
        this.balanceType() === 'negative'
          ? true
          : this.balanceType() === 'positive'
            ? false
            : undefined,
      gender: this.selectedGender() || undefined,
      isActive: this.isActive() || undefined,
      hasMedicalNotes: this.hasMedicalNotes() === true ? true : undefined,
      hasAppointments: this.hasAppointments() === true ? true : undefined,
      hasTreatments: this.hasTreatments() === true ? true : undefined,
    };

    this.patientsService.searchPatients(searchCriteria, this.pageable()).subscribe({
      next: response => {
        this.patients.set([...response.content]);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error loading patients:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Handles pagination changes
   */
  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.searchPatients();
  }

  /**
   * Handles sort changes
   */
  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortField.set(sort.active);
      this.sortDirection.set(sort.direction);
    } else {
      this.sortField.set('fullName');
      this.sortDirection.set('asc');
    }
    // Reset to first page when sorting changes
    this.pageIndex.set(0);
    this.searchPatients();
  }

  /**
   * Views patient details
   */
  viewPatient(patient: PatientSummaryDto): void {
    this.router.navigate(['/patients', 'details', patient.id]);
  }

  /**
   * Edits patient information
   */
  editPatient(patient: PatientSummaryDto): void {
    // TODO: Open edit dialog or navigate to edit page
    console.log('Edit patient:', patient);
  }

  /**
   * Creates a new patient
   */
  createNewPatient(): void {
    this.router.navigate(['../register'], { relativeTo: this.route });
  }

  /**
   * Toggles advanced filters visibility
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  /**
   * Clears all filters
   */
  clearFilters(): void {
    this.balanceFrom.set(null);
    this.balanceTo.set(null);
    this.balanceType.set('');
    this.selectedGender.set('');
    this.isActive.set(false);
    this.hasMedicalNotes.set(false);
    this.hasAppointments.set(false);
    this.hasTreatments.set(false);
    this.pageIndex.set(0);
    this.searchPatients();
  }

  /**
   * Applies filters and searches
   */
  applyFilters(): void {
    this.pageIndex.set(0);
    this.searchPatients();
    // Close the filters panel to show results
    this.showAdvancedFilters.set(false);
  }

  /**
   * Handles filter changes from advanced search component
   */
  onFiltersChanged(filters: any): void {
    // Update individual filter signals based on the dynamic form model
    this.balanceFrom.set(filters.balance?.balanceFrom || null);
    this.balanceTo.set(filters.balance?.balanceTo || null);
    this.balanceType.set(filters.balance?.balanceType || '');
    this.selectedGender.set(filters.demographics?.gender || '');
    this.isActive.set(filters.demographics?.isActive || false);
    // For regular checkboxes, use the boolean value directly
    this.hasMedicalNotes.set(filters.history?.hasMedicalNotes || false);
    this.hasAppointments.set(filters.history?.hasAppointments || false);
    this.hasTreatments.set(filters.history?.hasTreatments || false);

    this.applyFilters();
  }

  /**
   * Handles clear filters from advanced search component
   */
  onClearFilters(): void {
    this.clearFilters();
  }

  /**
   * Navigate to patient registration page
   */
  navigateToRegistration(): void {
    this.router.navigate(['../register'], { relativeTo: this.route });
  }
}
