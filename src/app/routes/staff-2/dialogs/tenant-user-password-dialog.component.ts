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
import { MatListModule } from '@angular/material/list';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import {
  TenantUserDto,
  ResetPasswordRequest,
} from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-password-dialog',
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
    MatListModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>lock_reset</mat-icon>
      Reset Password
    </h2>

    <mat-dialog-content>
      <div class="user-info">
        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>person</mat-icon>
            <div matListItemTitle>{{ data.firstName }} {{ data.lastName }}</div>
            <div matListItemLine>{{ data.username }} - {{ data.email }}</div>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="warning-message">
        <mat-icon>warning</mat-icon>
        <p>
          This action will reset the user's password. They will need to use the new password to log
          in.
        </p>
      </div>

      <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Password</mat-label>
          <input
            matInput
            formControlName="newPassword"
            [type]="hidePassword ? 'password' : 'text'"
            autocomplete="new-password"
          />
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
            <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (passwordForm.get('newPassword')?.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
          @if (passwordForm.get('newPassword')?.hasError('minlength')) {
            <mat-error>Password must be at least 8 characters</mat-error>
          }
          @if (passwordForm.get('newPassword')?.hasError('pattern')) {
            <mat-error>Password must contain uppercase, lowercase, and number</mat-error>
          }
          <mat-hint>Min 8 characters, must include uppercase, lowercase, and number</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm Password</mat-label>
          <input
            matInput
            formControlName="confirmPassword"
            [type]="hidePassword ? 'password' : 'text'"
            autocomplete="new-password"
          />
          @if (passwordForm.get('confirmPassword')?.hasError('required')) {
            <mat-error>Please confirm the password</mat-error>
          }
          @if (passwordForm.hasError('passwordMismatch')) {
            <mat-error>Passwords do not match</mat-error>
          }
        </mat-form-field>

        <div class="password-strength">
          <h4>Password Strength</h4>
          <div class="strength-indicator">
            <div class="strength-bar" [class]="getPasswordStrengthClass()"></div>
          </div>
          <span class="strength-text">{{ getPasswordStrengthText() }}</span>
        </div>

        <mat-slide-toggle formControlName="temporary" class="full-width">
          Force password change on next login
        </mat-slide-toggle>

        @if (passwordForm.get('temporary')?.value) {
          <div class="info-message">
            <mat-icon>info</mat-icon>
            <p>The user will be required to set a new password when they next log in.</p>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        (click)="onSubmit()"
        [disabled]="passwordForm.invalid || isLoading"
      >
        @if (isLoading) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>lock_reset</mat-icon>
            Reset Password
          </ng-container>
        }
      </button>
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
        min-width: 450px;
        max-width: 500px;
      }

      .user-info {
        padding: 8px 0;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }

      .warning-message,
      .info-message {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        margin: 16px 0;
        border-radius: 4px;

        mat-icon {
          margin-top: 2px;
        }

        p {
          margin: 0;
          flex: 1;
        }
      }

      .warning-message {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;

        mat-icon {
          color: #f39c12;
        }
      }

      .info-message {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;

        mat-icon {
          color: #17a2b8;
        }
      }

      .full-width {
        width: 100%;
      }

      .password-strength {
        margin: 20px 0;

        h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.87);
        }

        .strength-indicator {
          height: 4px;
          background-color: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;

          .strength-bar {
            height: 100%;
            transition:
              width 0.3s,
              background-color 0.3s;

            &.weak {
              width: 33%;
              background-color: #f44336;
            }

            &.medium {
              width: 66%;
              background-color: #ff9800;
            }

            &.strong {
              width: 100%;
              background-color: #4caf50;
            }
          }
        }

        .strength-text {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      mat-dialog-actions button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
})
export class TenantUserPasswordDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserPasswordDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  passwordForm!: FormGroup;
  isLoading = false;
  hidePassword = true;

  ngOnInit(): void {
    this.passwordForm = this.fb.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
        temporary: [true],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  getPasswordStrengthClass(): string {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (password.length < 8) return '';

    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&#]/.test(password)) strength++;

    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strengthClass = this.getPasswordStrengthClass();
    switch (strengthClass) {
      case 'weak':
        return 'Weak password';
      case 'medium':
        return 'Medium strength';
      case 'strong':
        return 'Strong password';
      default:
        return 'Enter a password';
    }
  }

  async onSubmit(): Promise<void> {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;

    try {
      const request: ResetPasswordRequest = {
        newPassword: this.passwordForm.get('newPassword')?.value,
        temporary: this.passwordForm.get('temporary')?.value,
      };

      await firstValueFrom(this.tenantUserService.resetUserPassword(this.data.userId!, request));

      this.snackBar.open('Password reset successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open('Error resetting password', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
