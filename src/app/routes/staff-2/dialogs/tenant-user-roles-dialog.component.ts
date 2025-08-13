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

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import {
  TenantUserDto,
  UpdateUserRolesRequest,
} from '../../../features/tenant-user-management/tenant-user-management.models';

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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>admin_panel_settings</mat-icon>
      Manage User Roles
    </h2>

    <mat-dialog-content>
      <div class="user-info">
        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>person</mat-icon>
            <div matListItemTitle>{{ data.firstName }} {{ data.lastName }}</div>
            <div matListItemLine>{{ data.username }}</div>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="current-roles">
        <h3>Current Roles</h3>
        <mat-chip-set>
          @for (role of data.roles; track role) {
            <mat-chip [color]="getRoleBadgeColor(role)" selected>
              <mat-icon>security</mat-icon>
              {{ role }}
            </mat-chip>
          }
        </mat-chip-set>
      </div>

      <form [formGroup]="rolesForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Roles</mat-label>
          <mat-select formControlName="roles" multiple>
            @for (role of availableRoles; track role) {
              <mat-option [value]="role">
                <mat-icon>{{ getRoleIcon(role) }}</mat-icon>
                {{ role }}
                <span class="role-description">{{ getRoleDescription(role) }}</span>
              </mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>security</mat-icon>
          @if (rolesForm.get('roles')?.hasError('required')) {
            <mat-error>At least one role is required</mat-error>
          }
        </mat-form-field>

        <div class="role-preview">
          <h3>New Roles Preview</h3>
          @if (rolesForm.get('roles')?.value?.length > 0) {
            <mat-chip-set>
              @for (role of rolesForm.get('roles')?.value; track role) {
                <mat-chip color="primary" selected>
                  <mat-icon>{{ getRoleIcon(role) }}</mat-icon>
                  {{ role }}
                </mat-chip>
              }
            </mat-chip-set>
          } @else {
            <p class="no-roles">No roles selected</p>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="rolesForm.invalid || isLoading || !hasChanges()"
      >
        @if (isLoading) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>save</mat-icon>
            Update Roles
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

      .current-roles,
      .role-preview {
        margin: 20px 0;

        h3 {
          margin-bottom: 12px;
          color: rgba(0, 0, 0, 0.87);
          font-size: 14px;
          font-weight: 500;
        }
      }

      .full-width {
        width: 100%;
      }

      .role-description {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.54);
        margin-top: 4px;
      }

      .no-roles {
        color: rgba(0, 0, 0, 0.54);
        font-style: italic;
        padding: 8px;
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      mat-chip {
        margin: 4px;
      }

      ::ng-deep {
        .mat-mdc-option {
          height: auto !important;
          padding: 12px 16px !important;

          .mat-icon {
            margin-right: 8px;
          }
        }

        .mat-mdc-chip-set {
          display: flex;
          flex-wrap: wrap;
        }
      }

      mat-dialog-actions button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
})
export class TenantUserRolesDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserRolesDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  rolesForm!: FormGroup;
  isLoading = false;

  availableRoles = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'STAFF', 'VIEWER'];

  ngOnInit(): void {
    this.rolesForm = this.fb.group({
      roles: [this.data.roles || [], Validators.required],
    });
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
