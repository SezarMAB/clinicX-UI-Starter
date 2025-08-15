import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import { GrantExternalAccessRequest } from '../../../features/tenant-user-management/tenant-user-management.models';
import { StaffRole } from '@features/staff';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-grant-external-access-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './grant-external-access-dialog.component.html',
  styleUrls: ['./grant-external-access-dialog.component.scss'],
})
export class GrantExternalAccessDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GrantExternalAccessDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);
  private translate = inject(TranslateService);

  accessForm!: FormGroup;
  isLoading = false;

  availableRoles = Object.values(StaffRole).filter(role => role !== StaffRole.SUPER_ADMIN);

  ngOnInit(): void {
    this.accessForm = this.fb.group({
      username: ['', Validators.required],
      roles: [[], Validators.required],
      accessNote: [''],
    });
  }

  getRoleIcon(role: StaffRole): string {
    switch (role) {
      case StaffRole.DOCTOR:
        return 'medical_services';
      case StaffRole.NURSE:
        return 'healing';
      case StaffRole.RECEPTIONIST:
        return 'support_agent';
      case StaffRole.ASSISTANT:
        return 'support';
      case StaffRole.ACCOUNTANT:
        return 'account_balance';
      case StaffRole.ADMIN:
        return 'admin_panel_settings';
      default:
        return 'person';
    }
  }

  async onSubmit(): Promise<void> {
    if (this.accessForm.invalid) return;

    this.isLoading = true;

    try {
      const formValue = this.accessForm.value;
      const request: GrantExternalAccessRequest = {
        username: formValue.username,
        roles: formValue.roles,
        accessNote: formValue.accessNote || undefined,
      };

      await firstValueFrom(this.tenantUserService.grantExternalUserAccess(request));

      this.snackBar.open(
        this.translate.instant('staff.grant_access_dialog.success'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      this.dialogRef.close(true);
    } catch (error: any) {
      const message =
        error?.error?.message || this.translate.instant('staff.grant_access_dialog.error');
      this.snackBar.open(message, this.translate.instant('common.close'), { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
