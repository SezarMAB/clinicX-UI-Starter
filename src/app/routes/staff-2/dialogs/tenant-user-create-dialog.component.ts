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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import { TenantUserCreateRequest } from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_add</mat-icon>
      Create New User
    </h2>

    <mat-dialog-content>
      <mat-stepper #stepper linear>
        <!-- Step 1: Basic Information -->
        <mat-step [stepControl]="basicInfoForm">
          <form [formGroup]="basicInfoForm">
            <ng-template matStepLabel>Basic Information</ng-template>

            <div class="form-container">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" />
                <mat-icon matSuffix>account_circle</mat-icon>
                @if (basicInfoForm.get('username')?.hasError('required')) {
                  <mat-error>Username is required</mat-error>
                }
                @if (basicInfoForm.get('username')?.hasError('minlength')) {
                  <mat-error>Username must be at least 3 characters</mat-error>
                }
                @if (basicInfoForm.get('username')?.hasError('pattern')) {
                  <mat-error
                    >Username can only contain letters, numbers, dots, underscores, and
                    hyphens</mat-error
                  >
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" />
                <mat-icon matSuffix>email</mat-icon>
                @if (basicInfoForm.get('email')?.hasError('required')) {
                  <mat-error>Email is required</mat-error>
                }
                @if (basicInfoForm.get('email')?.hasError('email')) {
                  <mat-error>Please enter a valid email address</mat-error>
                }
              </mat-form-field>

              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" />
                  <mat-icon matSuffix>person</mat-icon>
                  @if (basicInfoForm.get('firstName')?.hasError('required')) {
                    <mat-error>First name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" />
                  <mat-icon matSuffix>person</mat-icon>
                  @if (basicInfoForm.get('lastName')?.hasError('required')) {
                    <mat-error>Last name is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phoneNumber" placeholder="+1234567890" />
                <mat-icon matSuffix>phone</mat-icon>
                @if (basicInfoForm.get('phoneNumber')?.hasError('pattern')) {
                  <mat-error>Please enter a valid phone number</mat-error>
                }
              </mat-form-field>

              <div class="step-actions">
                <button mat-button matStepperNext type="button">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Security & Roles -->
        <mat-step [stepControl]="securityForm">
          <form [formGroup]="securityForm">
            <ng-template matStepLabel>Security & Roles</ng-template>

            <div class="form-container">
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input
                  matInput
                  formControlName="password"
                  [type]="hidePassword ? 'password' : 'text'"
                />
                <button
                  mat-icon-button
                  matSuffix
                  (click)="hidePassword = !hidePassword"
                  type="button"
                >
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (securityForm.get('password')?.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (securityForm.get('password')?.hasError('minlength')) {
                  <mat-error>Password must be at least 8 characters</mat-error>
                }
                @if (securityForm.get('password')?.hasError('pattern')) {
                  <mat-error>Password must contain uppercase, lowercase, and number</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Confirm Password</mat-label>
                <input
                  matInput
                  formControlName="confirmPassword"
                  [type]="hidePassword ? 'password' : 'text'"
                />
                @if (securityForm.hasError('passwordMismatch')) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Roles</mat-label>
                <mat-select formControlName="roles" multiple>
                  @for (role of availableRoles; track role) {
                    <mat-option [value]="role">{{ role }}</mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>security</mat-icon>
                @if (securityForm.get('roles')?.hasError('required')) {
                  <mat-error>At least one role is required</mat-error>
                }
              </mat-form-field>

              <mat-slide-toggle formControlName="temporaryPassword" class="full-width">
                Force password change on first login
              </mat-slide-toggle>

              <mat-slide-toggle formControlName="sendWelcomeEmail" class="full-width">
                Send welcome email
              </mat-slide-toggle>

              <div class="step-actions">
                <button mat-button matStepperPrevious type="button">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-button matStepperNext type="button">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Additional Attributes -->
        <mat-step [stepControl]="attributesForm">
          <form [formGroup]="attributesForm">
            <ng-template matStepLabel>Additional Information</ng-template>

            <div class="form-container">
              <mat-form-field appearance="outline">
                <mat-label>Department</mat-label>
                <input matInput formControlName="department" />
                <mat-icon matSuffix>business</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Specialization</mat-label>
                <input matInput formControlName="specialization" />
                <mat-icon matSuffix>school</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>License Number</mat-label>
                <input matInput formControlName="licenseNumber" />
                <mat-icon matSuffix>badge</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Employee ID</mat-label>
                <input matInput formControlName="employeeId" />
                <mat-icon matSuffix>fingerprint</mat-icon>
              </mat-form-field>

              <div class="step-actions">
                <button mat-button matStepperPrevious type="button">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  (click)="onSubmit()"
                  type="button"
                  [disabled]="isLoading"
                >
                  @if (isLoading) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <ng-container>
                      <mat-icon>save</mat-icon>
                      Create User
                    </ng-container>
                  }
                </button>
              </div>
            </div>
          </form>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 28px;
          height: 28px;
          width: 28px;
        }
      }

      mat-dialog-content {
        min-width: 600px;
        max-width: 700px;
        padding: 0 24px;
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 0;
      }

      .row {
        display: flex;
        gap: 16px;

        mat-form-field {
          flex: 1;
        }
      }

      .full-width {
        width: 100%;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);

        button {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      ::ng-deep {
        .mat-stepper-horizontal {
          margin-top: 8px;
        }

        .mat-form-field {
          width: 100%;
        }
      }
    `,
  ],
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
