import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TenantsService } from '../../../../features/tenants/tenants.service';
import { catchError, of } from 'rxjs';

export interface ResetPasswordDialogData {
  tenantId: string;
  tenantName: string;
  adminUsername?: string;
}

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Reset Admin Password</h2>
    <mat-dialog-content>
      <p class="mb-4 text-muted">
        Reset the admin password for tenant: <strong>{{ data.tenantName }}</strong>
      </p>

      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field appearance="outline">
          <mat-label>Admin Username</mat-label>
          <input
            matInput
            formControlName="adminUsername"
            placeholder="Enter admin username"
            [readonly]="!!data.adminUsername"
          />
          <mat-icon matSuffix>person</mat-icon>
          @if (
            form.get('adminUsername')?.hasError('required') && form.get('adminUsername')?.touched
          ) {
            <mat-error>Admin username is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>New Password</mat-label>
          <input
            matInput
            formControlName="newPassword"
            [type]="showPassword() ? 'text' : 'password'"
            placeholder="Enter new password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="'Toggle password visibility'"
          >
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.get('newPassword')?.hasError('required') && form.get('newPassword')?.touched) {
            <mat-error>Password is required</mat-error>
          }
          @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
            <mat-error>Password must be at least 8 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Confirm Password</mat-label>
          <input
            matInput
            formControlName="confirmPassword"
            [type]="showPassword() ? 'text' : 'password'"
            placeholder="Confirm new password"
          />
          @if (form.get('confirmPassword')?.touched || form.get('confirmPassword')?.dirty) {
            @if (form.get('confirmPassword')?.hasError('required')) {
              <mat-error>Please confirm the password</mat-error>
            } @else if (form.hasError('passwordMismatch')) {
              <mat-error>Passwords do not match</mat-error>
            }
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isSubmitting()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!form.valid || isSubmitting()"
      >
        @if (isSubmitting()) {
          <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
        }
        Reset Password
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
        padding: 20px 24px;
      }

      .text-muted {
        color: var(--mat-sys-on-surface-variant);
      }

      .mb-4 {
        margin-bottom: 16px;
      }

      .error-hint {
        color: var(--mat-sys-error);
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }

      .hint-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class ResetPasswordDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ResetPasswordDialog>);
  private readonly tenantsService = inject(TenantsService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.group(
    {
      adminUsername: [this.data.adminUsername || '', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: group => {
        const password = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        // Only validate if confirmPassword has a value
        if (!confirmPassword) return null;
        return password === confirmPassword ? null : { passwordMismatch: true };
      },
      updateOn: 'change', // Validate on every change
    }
  );

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.form.valid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { adminUsername, newPassword } = this.form.value;

    this.tenantsService
      .resetTenantAdminPassword(this.data.tenantId, {
        adminUsername: adminUsername!,
        newPassword: newPassword!,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Password reset successfully', 'Close', {
            duration: 3000,
            panelClass: 'snackbar-success',
          });
          this.dialogRef.close(true);
        },
        error: error => {
          console.error('Failed to reset password:', error);
          this.snackBar.open(error?.error?.message || 'Failed to reset password', 'Close', {
            duration: 5000,
            panelClass: 'snackbar-error',
          });
          this.isSubmitting.set(false);
        },
      });
  }
}
