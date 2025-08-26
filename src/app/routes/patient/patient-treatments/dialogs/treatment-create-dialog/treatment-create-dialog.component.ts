import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  effect,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, map, startWith } from 'rxjs';

import { TreatmentsService } from '@features/treatments';
import { StaffService } from '@features/staff';
import { TreatmentCreateRequest } from '@features/treatments/treatments.models';
import { StaffDto, StaffRole } from '@features/staff/staff.models';
import { AppointmentCardDto } from '@features/appointments/appointments.models';

interface DialogData {
  patientId: string;
}

@Component({
  selector: 'app-treatment-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatStepperModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './treatment-create-dialog.component.html',
  styleUrls: ['./treatment-create-dialog.component.scss'],
})
export class TreatmentCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly staffService = inject(StaffService);
  private readonly translate = inject(TranslateService);

  // Form groups
  treatmentForm!: FormGroup;

  // State signals
  loading = signal(false);
  saving = signal(false);
  doctors = signal<StaffDto[]>([]);
  appointments = signal<AppointmentCardDto[]>([]);

  // Staff resource for loading doctors
  private readonly staffPageRequest = signal({ page: 0, size: 100, sort: ['fullName'] });
  private readonly staffResource = this.staffService.getAllStaff(this.staffPageRequest);

  // Treatment types (could be loaded from backend)
  readonly treatmentTypes = [
    'Examination',
    'Cleaning',
    'Filling',
    'Extraction',
    'Root Canal',
    'Crown',
    'Bridge',
    'Implant',
    'Orthodontics',
    'Other',
  ];

  // Inputs/Outputs for inline usage
  @Input() patientId?: string;
  @Output() saved = new EventEmitter<any>();
  @Output() canceled = new EventEmitter<void>();
  // Optional dialog dependencies so this component can be used inline as well
  readonly dialogRef = inject(MatDialogRef<TreatmentCreateDialogComponent>, { optional: true });
  readonly data = inject<DialogData>(MAT_DIALOG_DATA, { optional: true });

  constructor() {
    // Load doctors using effect
    effect(() => {
      const staffData = this.staffResource.value();
      if (staffData) {
        const doctors = staffData.content.filter(
          s => s.role === StaffRole.DOCTOR || s.role === StaffRole.ADMIN
        );
        this.doctors.set(doctors);
      }

      this.loading.set(this.staffResource.isLoading());
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupAutocomplete();
  }

  private initializeForm(): void {
    this.treatmentForm = this.fb.group({
      treatmentType: ['', Validators.required],
      description: ['', Validators.required],
      performedBy: ['', Validators.required],
      treatmentDate: [new Date(), Validators.required],
      duration: [30, [Validators.min(1)]],
      cost: ['', [Validators.required, Validators.min(0)]],
      notes: [''],
      // Material tracking will be handled separately
      requiresMaterials: [false],
    });

    // Watch for treatment type changes to update description
    this.treatmentForm.get('treatmentType')?.valueChanges.subscribe(treatmentType => {
      // Auto-update description based on treatment type if needed
    });
  }

  private setupAutocomplete(): void {
    // Setup autocomplete for treatment types if needed
  }

  onSubmit(): void {
    if (this.treatmentForm.invalid) {
      this.treatmentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.treatmentForm.value;

    const request: TreatmentCreateRequest = {
      patientId: (this.data?.patientId || this.patientId) as string,
      treatmentType: formValue.treatmentType,
      description: formValue.description,
      notes: formValue.notes || undefined,
      treatmentDate: this.formatDate(formValue.treatmentDate),
      duration: formValue.duration || undefined,
      cost: formValue.cost,
      performedBy: formValue.performedBy,
    };

    this.treatmentsService.createTreatment(request).subscribe({
      next: treatment => {
        this.saving.set(false);

        // If materials are required, open materials dialog
        if (formValue.requiresMaterials) {
          // TODO: Open materials dialog
          if (this.dialogRef) {
            this.dialogRef.close({ treatment, requiresMaterials: true });
          } else {
            this.saved.emit({ treatment, requiresMaterials: true });
          }
        } else {
          if (this.dialogRef) {
            this.dialogRef.close(treatment);
          } else {
            this.saved.emit(treatment);
          }
        }
      },
      error: error => {
        this.saving.set(false);
        console.error('Error creating treatment:', error);
        // Show error message using translate service
        // TODO: Add toast notification with translated message
      },
    });
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.canceled.emit();
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Validation helpers
  getErrorMessage(fieldName: string): string {
    const control = this.treatmentForm.get(fieldName);

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors.required) {
      return this.translate.instant('validation.field_required');
    }

    if (control.errors.min) {
      return this.translate.instant('validation.min_value', { value: control.errors.min.min });
    }

    return this.translate.instant('validation.invalid_value');
  }
}
