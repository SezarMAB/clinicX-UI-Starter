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
import { Router } from '@angular/router';
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
import { BreadcrumbComponent } from '@shared';

import { PatientsService } from '@features/patients';
import { PatientSummaryDto, PatientSearchCriteria } from '@features/patients/patients.models';
import { Pageable } from '@core/models/pagination.model';
import { PatientTableComponent } from '../patient-table/patient-table.component';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    BreadcrumbComponent,
    PatientTableComponent,
    MatBadgeModule,
    TranslateModule,
  ],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css'],
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
  isBalanceNegative = signal<boolean | null>(null);
  selectedGender = signal<string>('');
  isActive = signal<boolean>(false);
  hasMedicalNotes = signal<boolean | null>(null);
  hasAppointments = signal<boolean | null>(null);
  hasTreatments = signal<boolean | null>(null);

  // Patient data
  patients = signal<PatientSummaryDto[]>([]);

  // Pagination state
  totalElements = signal(0);
  pageSize = signal(20);
  pageIndex = signal(0);

  // Sort state
  sortField = signal('fullName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Computed active filter count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.balanceFrom() !== null) count++;
    if (this.balanceTo() !== null) count++;
    if (this.isBalanceNegative() !== null) count++;
    if (this.selectedGender()) count++;
    if (this.isActive()) count++;
    if (this.hasMedicalNotes() !== null) count++;
    if (this.hasAppointments() !== null) count++;
    if (this.hasTreatments() !== null) count++;
    return count;
  });

  // Computed pagination params
  private pageable = computed<Pageable>(() => ({
    page: this.pageIndex(),
    size: this.pageSize(),
    sort: this.sortField(),
    direction: this.sortDirection(),
  }));

  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {}

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
      isBalanceNegative: this.isBalanceNegative() ?? undefined,
      gender: this.selectedGender() || undefined,
      isActive: this.isActive() || undefined,
      hasMedicalNotes: this.hasMedicalNotes() ?? undefined,
      hasAppointments: this.hasAppointments() ?? undefined,
      hasTreatments: this.hasTreatments() ?? undefined,
    };

    this.patientsService.searchPatients(searchCriteria, this.pageable()).subscribe({
      next: response => {
        this.patients.set(response.content);
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
    this.router.navigate(['/patient', patient.id]);
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
    // TODO: Open create dialog or navigate to create page
    console.log('Create new patient');
  }

  /**
   * Handles tri-state checkbox click
   */
  toggleTriState(signal: any): void {
    const currentValue = signal();
    if (currentValue === null) {
      signal.set(true);
    } else if (currentValue === true) {
      signal.set(false);
    } else {
      signal.set(null);
    }
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
    this.isBalanceNegative.set(null);
    this.selectedGender.set('');
    this.isActive.set(false);
    this.hasMedicalNotes.set(null);
    this.hasAppointments.set(null);
    this.hasTreatments.set(null);
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
}
