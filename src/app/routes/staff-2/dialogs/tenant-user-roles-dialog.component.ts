import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '@features';
import { TenantUserDto, UpdateUserRolesRequest, TenantUserUtils } from '@features';
import { StaffRole, StaffRoleUtils, STAFF_ROLE_DISPLAY_NAMES } from '@features/staff';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tenant-user-roles-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatListModule,
  ],
  templateUrl: './tenant-user-roles-dialog.component.html',
  styleUrls: ['./tenant-user-roles-dialog.component.scss'],
})
export class TenantUserRolesDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserRolesDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);
  private translate = inject(TranslateService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  rolesForm: FormGroup;
  isLoading = false;

  availableRoles = StaffRoleUtils.getAllRoles();

  constructor() {
    this.rolesForm = this.fb.group({
      roles: [StaffRoleUtils.deduplicate([...(this.data.roles || [])]), Validators.required],
    });
  }

  ngOnInit(): void {
    // Form is initialized in constructor
  }

  getRoleDisplayName(role: StaffRole): string {
    return StaffRoleUtils.getDisplayName(role);
  }

  getRoleBadgeColor(role: StaffRole): string {
    if (StaffRoleUtils.isAdministrative(role)) return 'warn';
    if (role === StaffRole.DOCTOR) return 'primary';
    if (role === StaffRole.NURSE) return 'accent';
    return '';
  }

  getRoleIcon(role: StaffRole): string {
    switch (role) {
      case StaffRole.SUPER_ADMIN:
        return 'shield';
      case StaffRole.ADMIN:
        return 'admin_panel_settings';
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
      case StaffRole.EXTERNAL:
        return 'person_outline';
      case StaffRole.INTERNAL:
        return 'person';
      default:
        return 'person';
    }
  }

  getRoleDescription(role: StaffRole): string {
    switch (role) {
      case StaffRole.SUPER_ADMIN:
        return this.translate.instant('staff.roles.super_admin_desc');
      case StaffRole.ADMIN:
        return this.translate.instant('staff.roles.admin_desc');
      case StaffRole.DOCTOR:
        return this.translate.instant('staff.roles.doctor_desc');
      case StaffRole.NURSE:
        return this.translate.instant('staff.roles.nurse_desc');
      case StaffRole.RECEPTIONIST:
        return this.translate.instant('staff.roles.receptionist_desc');
      case StaffRole.ASSISTANT:
        return this.translate.instant('staff.roles.assistant_desc');
      case StaffRole.ACCOUNTANT:
        return this.translate.instant('staff.roles.accountant_desc');
      case StaffRole.EXTERNAL:
        return this.translate.instant('staff.roles.external_desc');
      case StaffRole.INTERNAL:
        return this.translate.instant('staff.roles.internal_desc');
      default:
        return '';
    }
  }

  hasChanges(): boolean {
    const currentRoles = this.data.roles || [];
    const newRoles = this.rolesForm.get('roles')?.value || [];

    if (currentRoles.length !== newRoles.length) return true;

    const sortedCurrent = [...currentRoles].sort();
    const sortedNew = [...newRoles].sort();

    return !sortedCurrent.every((role, index) => role === sortedNew[index]);
  }

  async onSubmit(): Promise<void> {
    if (this.rolesForm.invalid || !this.hasChanges()) return;

    this.isLoading = true;

    try {
      const selectedRoles: StaffRole[] = this.rolesForm.get('roles')?.value || [];
      const request = TenantUserUtils.createUpdateRolesRequest(selectedRoles);

      await firstValueFrom(this.tenantUserService.updateUserRoles(this.data.userId!, request));

      this.snackBar.open(
        this.translate.instant('staff.roles_dialog.success'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open(
        this.translate.instant('staff.roles_dialog.error'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
