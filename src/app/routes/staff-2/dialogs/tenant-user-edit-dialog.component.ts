import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import {
  TenantUserDto,
  TenantUserUpdateRequest,
} from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Edit User
    </h2>

    <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-container">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput [value]="data.username" disabled />
            <mat-icon matSuffix>account_circle</mat-icon>
            <mat-hint>Username cannot be changed</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
            <mat-icon matSuffix>email</mat-icon>
            @if (editForm.get('email')?.hasError('email')) {
              <mat-error>Please enter a valid email address</mat-error>
            }
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" />
              <mat-icon matSuffix>person</mat-icon>
              @if (editForm.get('firstName')?.hasError('maxlength')) {
                <mat-error>First name must not exceed 100 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" />
              <mat-icon matSuffix>person</mat-icon>
              @if (editForm.get('lastName')?.hasError('maxlength')) {
                <mat-error>Last name must not exceed 100 characters</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Phone Number</mat-label>
            <input matInput formControlName="phoneNumber" placeholder="+1234567890" />
            <mat-icon matSuffix>phone</mat-icon>
            @if (editForm.get('phoneNumber')?.hasError('pattern')) {
              <mat-error>Please enter a valid phone number</mat-error>
            }
          </mat-form-field>

          <mat-slide-toggle formControlName="enabled" class="full-width">
            Account Enabled
          </mat-slide-toggle>

          <div class="attributes-section">
            <h3>Additional Attributes</h3>
            <div formGroupName="attributes">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Department</mat-label>
                <input matInput formControlName="department" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Specialization</mat-label>
                <input matInput formControlName="specialization" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>License Number</mat-label>
                <input matInput formControlName="licenseNumber" />
              </mat-form-field>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()" [disabled]="isLoading">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="editForm.invalid || isLoading"
        >
          @if (isLoading) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <ng-container>
              <mat-icon>save</mat-icon>
              Save Changes
            </ng-container>
          }
        </button>
      </mat-dialog-actions>
    </form>
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

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 0;
        min-width: 500px;
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

      .attributes-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);

        h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: rgba(0, 0, 0, 0.87);
          font-size: 16px;
        }
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      mat-dialog-actions {
        padding: 16px 24px;

        button {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    `,
  ],
})
export class TenantUserEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserEditDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  editForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    // Extract existing attributes
    const attributes = this.data.attributes || {};
    const department = this.getAttributeValue(attributes, 'department');
    const specialization = this.getAttributeValue(attributes, 'specialization');
    const licenseNumber = this.getAttributeValue(attributes, 'licenseNumber');

    this.editForm = this.fb.group({
      email: [this.data.email, [Validators.email]],
      firstName: [this.data.firstName, [Validators.maxLength(100)]],
      lastName: [this.data.lastName, [Validators.maxLength(100)]],
      phoneNumber: [
        this.getAttributeValue(attributes, 'phoneNumber'),
        [Validators.pattern(/^\+?[0-9\-\s]+$/)],
      ],
      enabled: [this.data.enabled],
      attributes: this.fb.group({
        department: [department],
        specialization: [specialization],
        licenseNumber: [licenseNumber],
      }),
    });
  }

  private getAttributeValue(attributes: Record<string, readonly string[]>, key: string): string {
    const values = attributes[key];
    return values && values.length > 0 ? values[0] : '';
  }

  async onSubmit(): Promise<void> {
    if (this.editForm.invalid) return;

    this.isLoading = true;

    try {
      const formValue = this.editForm.value;
      const attributes: Record<string, string> = {};

      // Only include non-empty attributes
      Object.entries(formValue.attributes).forEach(([key, value]) => {
        if (value) {
          attributes[key] = value as string;
        }
      });

      const updateRequest: TenantUserUpdateRequest = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber,
        enabled: formValue.enabled,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      };

      await firstValueFrom(this.tenantUserService.updateUser(this.data.userId!, updateRequest));

      this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open('Error updating user', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
