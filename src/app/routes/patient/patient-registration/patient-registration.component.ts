import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { PatientsService } from '@features/patients/patients.service';
import { PatientCreateRequest, Gender } from '@features/patients/patients.models';

@Component({
  selector: 'app-patient-registration',
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
})
export class PatientRegistrationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly patientsService = inject(PatientsService);
  private readonly toastr = inject(ToastrService);

  // Signals for state management
  readonly loading = signal(false);
  readonly maxDate = new Date(); // Today's date for date picker validation

  // Gender options
  readonly genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ];

  // Form definition with validators
  readonly registrationForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    dateOfBirth: ['', Validators.required],
    gender: ['', Validators.maxLength(10)],
    phoneNumber: ['', [Validators.maxLength(30), Validators.pattern(/^[\d\s\-+()]+$/)]],
    email: ['', [Validators.maxLength(100), Validators.email]],
    address: [''],
    insuranceProvider: ['', Validators.maxLength(100)],
    insuranceNumber: ['', Validators.maxLength(50)],
    importantMedicalNotes: [''],
  });

  /**
   * Submit the registration form
   */
  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formValue = this.registrationForm.value;
    const request: PatientCreateRequest = {
      fullName: formValue.fullName!,
      dateOfBirth: this.formatDate(formValue.dateOfBirth!),
      gender: (formValue.gender as Gender) || undefined,
      phoneNumber: formValue.phoneNumber || undefined,
      email: formValue.email || undefined,
      address: formValue.address || undefined,
      insuranceProvider: formValue.insuranceProvider || undefined,
      insuranceNumber: formValue.insuranceNumber || undefined,
      importantMedicalNotes: formValue.importantMedicalNotes || undefined,
    };

    this.patientsService.createPatient(request).subscribe({
      next: patient => {
        this.loading.set(false);
        this.toastr.success('Patient registered successfully', 'Success');
        // Navigate to patient details page
        this.router.navigate(['/patient', patient.id]);
      },
      error: error => {
        this.loading.set(false);
        this.toastr.error(error.error?.message || 'Failed to register patient', 'Error');
      },
    });
  }

  /**
   * Cancel registration and navigate back
   */
  onCancel(): void {
    this.router.navigate(['/patient']);
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.registrationForm.get(fieldName);

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors.required) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.errors.maxlength) {
      const maxLength = control.errors.maxlength.requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }

    if (control.errors.email) {
      return 'Please enter a valid email address';
    }

    if (control.errors.pattern) {
      if (fieldName === 'phoneNumber') {
        return 'Please enter a valid phone number';
      }
    }

    return 'Invalid value';
  }

  /**
   * Get friendly field labels
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full name',
      dateOfBirth: 'Date of birth',
      gender: 'Gender',
      phoneNumber: 'Phone number',
      email: 'Email',
      address: 'Address',
      insuranceProvider: 'Insurance provider',
      insuranceNumber: 'Insurance number',
      importantMedicalNotes: 'Medical notes',
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Format date to yyyy-MM-dd string
   */
  private formatDate(date: any): string {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return date;
  }
}
