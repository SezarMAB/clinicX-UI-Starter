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

import { TenantUserManagementService } from '@features';
import { TenantUserDto, ResetPasswordRequest } from '@features';

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
  templateUrl: './tenant-user-password-dialog.component.html',
  styleUrls: ['./tenant-user-password-dialog.component.scss'],
})
export class TenantUserPasswordDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserPasswordDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  passwordForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor() {
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

  ngOnInit(): void {
    // Form is initialized in constructor
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
