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
import { TenantUserDto, UpdateUserRolesRequest } from '@features';

@Component({
  selector: 'app-tenant-user-roles-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  rolesForm: FormGroup;
  isLoading = false;

  availableRoles = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'STAFF', 'VIEWER'];

  constructor() {
    this.rolesForm = this.fb.group({
      roles: [this.data.roles || [], Validators.required],
    });
  }

  ngOnInit(): void {
    // Form is initialized in constructor
  }

  getRoleBadgeColor(role: string): string {
    if (role.includes('ADMIN')) return 'warn';
    if (role.includes('DOCTOR')) return 'primary';
    if (role.includes('NURSE')) return 'accent';
    return '';
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'shield';
      case 'ADMIN':
        return 'admin_panel_settings';
      case 'DOCTOR':
        return 'medical_services';
      case 'NURSE':
        return 'healing';
      case 'RECEPTIONIST':
        return 'support_agent';
      case 'STAFF':
        return 'badge';
      case 'VIEWER':
        return 'visibility';
      default:
        return 'person';
    }
  }

  getRoleDescription(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Full system access';
      case 'ADMIN':
        return 'Tenant administration';
      case 'DOCTOR':
        return 'Medical professional';
      case 'NURSE':
        return 'Nursing staff';
      case 'RECEPTIONIST':
        return 'Front desk operations';
      case 'STAFF':
        return 'General staff member';
      case 'VIEWER':
        return 'Read-only access';
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
      const request: UpdateUserRolesRequest = {
        roles: this.rolesForm.get('roles')?.value,
      };

      await firstValueFrom(this.tenantUserService.updateUserRoles(this.data.userId!, request));

      this.snackBar.open('User roles updated successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open('Error updating user roles', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
