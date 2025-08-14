import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '@features';
import { TenantUserCreateRequest } from '@features';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tenant-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatStepperModule,
  ],
  templateUrl: './tenant-user-create-dialog.component.html',
  styleUrls: ['./tenant-user-create-dialog.component.scss'],
})
export class TenantUserCreateDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserCreateDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  basicInfoForm!: FormGroup;
  securityForm!: FormGroup;
  attributesForm!: FormGroup;

  isLoading = false;
  hidePassword = true;

  availableRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'STAFF', 'VIEWER'];

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    this.basicInfoForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\-\s]+$/)]],
    });

    this.securityForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
        roles: [[], Validators.required],
        temporaryPassword: [true],
        sendWelcomeEmail: [true],
      },
      { validators: this.passwordMatchValidator }
    );

    this.attributesForm = this.fb.group({
      department: [''],
      specialization: [''],
      licenseNumber: [''],
      employeeId: [''],
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.basicInfoForm.invalid || this.securityForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    try {
      const basicInfo = this.basicInfoForm.value;
      const security = this.securityForm.value;
      const attributes = this.attributesForm.value;

      const additionalAttributes: Record<string, string> = {};
      Object.entries(attributes).forEach(([key, value]) => {
        if (value) {
          additionalAttributes[key] = value as string;
        }
      });

      const createRequest: TenantUserCreateRequest = {
        username: basicInfo.username,
        email: basicInfo.email,
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        password: security.password,
        roles: security.roles,
        phoneNumber: basicInfo.phoneNumber || undefined,
        temporaryPassword: security.temporaryPassword,
        sendWelcomeEmail: security.sendWelcomeEmail,
        additionalAttributes:
          Object.keys(additionalAttributes).length > 0 ? additionalAttributes : undefined,
      };

      await firstValueFrom(this.tenantUserService.createUser(createRequest));

      this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open('Error creating user', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
