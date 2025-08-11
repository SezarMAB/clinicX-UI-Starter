import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { StaffApiService } from '../../../features/staff/staff-api.service';
import {
  StaffDto,
  StaffRole,
  StaffCreateRequest,
  StaffUpdateRequest,
} from '../../../features/staff/staff.models';

@Component({
  selector: 'app-staff-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
  ],
  templateUrl: './staff-form-page.component.html',
  styleUrls: ['./staff-form-page.component.scss'],
})
export class StaffFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly snackBar = inject(MatSnackBar);
  private readonly staffApi = inject(StaffApiService);

  readonly staff: StaffDto | null = this.route.snapshot.data.staff;
  readonly isEditMode = !!this.staff;
  readonly pageTitle = this.isEditMode ? 'Edit Staff Member' : 'New Staff Member';
  readonly staffRoles = Object.values(StaffRole);

  loading = false;
  serverErrors: Record<string, string> = {};

  readonly staffForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    role: [null as StaffRole | null, Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phoneNumber: ['', Validators.maxLength(30)],
    isActive: [true],
    specialtyIds: [[] as string[]],
    // Keycloak fields (only for create)
    createKeycloakUser: [false],
    password: ['', [Validators.minLength(8)]],
    username: [''],
    firstName: [''],
    lastName: [''],
    keycloakUserId: [''],
    accessRole: [''],
    isPrimaryTenant: [true],
  });

  get createKeycloakUser() {
    return this.staffForm.get('createKeycloakUser')?.value;
  }

  ngOnInit(): void {
    if (this.isEditMode && this.staff) {
      this.populateForm(this.staff);
    }

    // Set up password validation based on createKeycloakUser toggle
    this.staffForm.get('createKeycloakUser')?.valueChanges.subscribe(create => {
      const passwordControl = this.staffForm.get('password');
      if (create) {
        passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
      } else {
        passwordControl?.clearValidators();
        passwordControl?.setValue('');
      }
      passwordControl?.updateValueAndValidity();
    });
  }

  private populateForm(staff: StaffDto): void {
    this.staffForm.patchValue({
      fullName: staff.fullName,
      role: staff.role,
      email: staff.email,
      phoneNumber: staff.phoneNumber || '',
      isActive: staff.isActive,
      specialtyIds: staff.specialties?.map(s => s.id) || [],
    });

    // Disable Keycloak fields in edit mode
    this.staffForm.get('createKeycloakUser')?.disable();
    this.staffForm.get('password')?.disable();
    this.staffForm.get('username')?.disable();
    this.staffForm.get('firstName')?.disable();
    this.staffForm.get('lastName')?.disable();
    this.staffForm.get('keycloakUserId')?.disable();
    this.staffForm.get('accessRole')?.disable();
    this.staffForm.get('isPrimaryTenant')?.disable();
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.serverErrors = {};

    if (this.isEditMode && this.staff) {
      this.updateStaff();
    } else {
      this.createStaff();
    }
  }

  private createStaff(): void {
    const formValue = this.staffForm.value;
    const request: StaffCreateRequest = {
      fullName: formValue.fullName!,
      role: formValue.role!,
      email: formValue.email!,
      phoneNumber: formValue.phoneNumber || undefined,
      specialtyIds: formValue.specialtyIds || undefined,
      createKeycloakUser: formValue.createKeycloakUser || false,
      password: formValue.password || undefined,
      username: formValue.username || undefined,
      firstName: formValue.firstName || undefined,
      lastName: formValue.lastName || undefined,
      keycloakUserId: formValue.keycloakUserId || undefined,
      accessRole: formValue.accessRole || undefined,
      isPrimaryTenant: formValue.isPrimaryTenant || true,
    };

    this.staffApi.create(request).subscribe({
      next: staff => {
        this.snackBar.open('Staff member created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/staff', staff.id]);
      },
      error: error => {
        this.loading = false;
        this.handleServerError(error);
      },
    });
  }

  private updateStaff(): void {
    const formValue = this.staffForm.value;
    const request: StaffUpdateRequest = {
      fullName: formValue.fullName!,
      role: formValue.role!,
      email: formValue.email!,
      phoneNumber: formValue.phoneNumber || undefined,
      isActive: formValue.isActive!,
      specialtyIds: formValue.specialtyIds || undefined,
    };

    this.staffApi.update(this.staff!.id, request).subscribe({
      next: staff => {
        this.snackBar.open('Staff member updated successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/staff', staff.id]);
      },
      error: error => {
        this.loading = false;
        this.handleServerError(error);
      },
    });
  }

  private handleServerError(error: any): void {
    if (error.status === 400 && error.error) {
      if (error.error.errors) {
        // Field-specific validation errors
        for (const [field, message] of Object.entries(error.error.errors)) {
          this.serverErrors[field] = message as string;
          const control = this.staffForm.get(field);
          if (control) {
            control.setErrors({ server: message });
          }
        }
      } else if (error.error.message) {
        // General validation error
        this.snackBar.open(error.error.message, 'Close', { duration: 5000 });
      }
    } else if (error.status === 404) {
      this.snackBar.open('Staff member not found', 'Close', { duration: 3000 });
      this.router.navigate(['/staff']);
    } else {
      this.snackBar.open('An error occurred. Please try again.', 'Close', { duration: 3000 });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.staffForm.controls).forEach(key => {
      const control = this.staffForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.staffForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors.required) return `${this.getFieldLabel(fieldName)} is required`;
    if (control.errors.email) return 'Invalid email format';
    if (control.errors.maxLength) {
      const maxLength = control.errors.maxLength.requiredLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
    }
    if (control.errors.minLength) {
      const minLength = control.errors.minLength.requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    if (control.errors.server) return control.errors.server;

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      fullName: 'Full name',
      role: 'Role',
      email: 'Email',
      phoneNumber: 'Phone number',
      password: 'Password',
      username: 'Username',
      firstName: 'First name',
      lastName: 'Last name',
    };
    return labels[fieldName] || fieldName;
  }

  cancel(): void {
    if (this.isEditMode && this.staff) {
      this.router.navigate(['/staff', this.staff.id]);
    } else {
      this.router.navigate(['/staff']);
    }
  }
}
