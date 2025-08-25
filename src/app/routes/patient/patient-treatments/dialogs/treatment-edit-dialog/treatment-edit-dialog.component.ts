import { Component, Inject, OnInit, signal, inject, effect } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TreatmentsService } from '@features/treatments';
import { StaffService } from '@features/staff';
import { TreatmentLogDto, TreatmentCreateRequest } from '@features/treatments/treatments.models';
import { StaffDto, StaffRole } from '@features/staff/staff.models';

interface DialogData {
  treatment: TreatmentLogDto;
  patientId: string;
}

@Component({
  selector: 'app-treatment-edit-dialog',
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
    MatProgressSpinnerModule,
    MatCheckboxModule,
    TranslateModule,
  ],
  templateUrl: './treatment-edit-dialog.component.html',
  styleUrls: ['./treatment-edit-dialog.component.scss'],
})
export class TreatmentEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly staffService = inject(StaffService);
  private readonly translate = inject(TranslateService);

  // Form
  treatmentForm!: FormGroup;

  // State signals
  loading = signal(false);
  saving = signal(false);
  doctors = signal<StaffDto[]>([]);

  // Staff resource - must be initialized in injection context
  private readonly staffPageRequest = signal({ page: 0, size: 100, sort: ['fullName'] });
  private readonly staffResource = this.staffService.getAllStaff(this.staffPageRequest);

  // Treatment types
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

  // Visit types
  readonly visitTypes = ['Treatment', 'Consultation', 'Emergency', 'Follow-up', 'Checkup'];

  // Status options
  readonly statusOptions = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  readonly dialogRef = inject(MatDialogRef<TreatmentEditDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  constructor() {
    // Use effect to reactively handle staff resource changes
    effect(() => {
      const staffData = this.staffResource.value();
      const error = this.staffResource.error();
      const isLoading = this.staffResource.isLoading();

      if (isLoading) {
        this.loading.set(true);
      } else if (staffData) {
        const doctors = staffData.content.filter(
          s => s.role === StaffRole.DOCTOR || s.role === StaffRole.ADMIN
        );
        this.doctors.set(doctors);
        this.loading.set(false);
      } else if (error) {
        console.error('Failed to load staff:', error);
        this.loading.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    // Staff loading is handled by the effect in constructor
  }

  private initializeForm(): void {
    const treatment = this.data.treatment;

    this.treatmentForm = this.fb.group({
      treatmentName: [treatment.treatmentName || treatment.treatmentType, Validators.required],
      visitType: [treatment.visitType || 'Treatment', Validators.required],
      doctorName: [treatment.doctorName || treatment.performedBy, Validators.required],
      treatmentDate: [new Date(treatment.treatmentDate), Validators.required],
      treatmentTime: [treatment.treatmentTime || '09:00:00'],
      toothNumber: [treatment.toothNumber],
      durationMinutes: [treatment.durationMinutes || treatment.duration || 30, [Validators.min(1)]],
      cost: [treatment.cost || 0, [Validators.required, Validators.min(0)]],
      status: [treatment.status, Validators.required],
      notes: [treatment.notes || ''],
      nextAppointment: [treatment.nextAppointment ? new Date(treatment.nextAppointment) : null],
    });
  }

  onSubmit(): void {
    if (this.treatmentForm.invalid) {
      this.treatmentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.treatmentForm.value;

    // For update, we'll need to create a new treatment since there's no update endpoint
    // This is a simplified version - in production you'd have an update endpoint
    const request: TreatmentCreateRequest = {
      patientId: this.data.patientId,
      treatmentType: formValue.treatmentName || formValue.treatmentType,
      description: formValue.notes || formValue.description,
      notes: formValue.notes || undefined,
      treatmentDate:
        this.formatDate(formValue.treatmentDate) + 'T' + (formValue.treatmentTime || '09:00:00'),
      duration: formValue.durationMinutes || formValue.duration || undefined,
      cost: formValue.cost,
      performedBy: formValue.doctorName || formValue.performedBy,
    };

    // Since we don't have an update endpoint, we'll just close with the updated data
    // In a real app, you'd call: this.treatmentsService.updateTreatment(this.data.treatment.id, request)
    this.dialogRef.close({
      ...this.data.treatment,
      ...request,
      status: formValue.status,
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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
