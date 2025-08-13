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

@Component({
  selector: 'app-grant-external-access-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_add</mat-icon>
      Grant External User Access
    </h2>

    <mat-dialog-content>
      <div class="info-section">
        <mat-icon>info</mat-icon>
        <div>
          <p><strong>Grant access to users from other tenants</strong></p>
          <p>
            This allows users from partner clinics or other organizations to access your tenant with
            specific roles.
          </p>
        </div>
      </div>

      <mat-divider></mat-divider>

      <form [formGroup]="accessForm" (ngSubmit)="onSubmit()">
        <div class="form-container">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input
              matInput
              formControlName="username"
              placeholder="Enter the external user's username"
            />
            <mat-icon matSuffix>account_circle</mat-icon>
            @if (accessForm.get('username')?.hasError('required')) {
              <mat-error>Username is required</mat-error>
            }
            <mat-hint>The username must exist in another tenant</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Roles</mat-label>
            <mat-select formControlName="roles" multiple>
              @for (role of availableRoles; track role) {
                <mat-option [value]="role">
                  <mat-icon>{{ getRoleIcon(role) }}</mat-icon>
                  {{ role }}
                </mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>security</mat-icon>
            @if (accessForm.get('roles')?.hasError('required')) {
              <mat-error>At least one role is required</mat-error>
            }
            <mat-hint>Select the roles this external user will have in your tenant</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Access Note (Optional)</mat-label>
            <textarea
              matInput
              formControlName="accessNote"
              rows="3"
              placeholder="e.g., Visiting specialist from partner clinic"
            >
            </textarea>
            <mat-icon matSuffix>note</mat-icon>
            <mat-hint>Add a note about why access is being granted</mat-hint>
          </mat-form-field>

          @if (accessForm.get('roles')?.value?.length > 0) {
            <div class="role-preview">
              <h4>Selected Roles:</h4>
              <mat-chip-set>
                @for (role of accessForm.get('roles')?.value; track role) {
                  <mat-chip color="primary" selected>
                    <mat-icon>{{ getRoleIcon(role) }}</mat-icon>
                    {{ role }}
                  </mat-chip>
                }
              </mat-chip-set>
            </div>
          }

          <div class="security-notice">
            <mat-icon>security</mat-icon>
            <div>
              <p><strong>Security Notice:</strong></p>
              <ul>
                <li>The external user will have access to data based on the assigned roles</li>
                <li>Access can be revoked at any time from the user management page</li>
                <li>All actions by external users are logged for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="accessForm.invalid || isLoading"
      >
        @if (isLoading) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>check</mat-icon>
            Grant Access
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
        min-width: 500px;
        max-width: 600px;
      }

      .info-section {
        display: flex;
        gap: 12px;
        padding: 16px;
        background-color: #e3f2fd;
        border-radius: 4px;
        margin-bottom: 20px;

        mat-icon {
          color: #1976d2;
        }

        p {
          margin: 0 0 4px 0;
          &:first-child {
            color: #1976d2;
          }
          &:last-child {
            font-size: 13px;
            color: rgba(0, 0, 0, 0.7);
          }
        }
      }

      mat-divider {
        margin: 20px 0;
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 0;
      }

      .role-preview {
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;

        h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.87);
        }
      }

      .security-notice {
        display: flex;
        gap: 12px;
        padding: 12px;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        margin-top: 8px;

        mat-icon {
          color: #f39c12;
        }

        p {
          margin: 0 0 8px 0;
          font-weight: 500;
          color: #856404;
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            font-size: 13px;
            color: #856404;
            margin-bottom: 4px;
          }
        }
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      ::ng-deep {
        .mat-mdc-form-field {
          width: 100%;
        }

        .mat-mdc-option {
          .mat-icon {
            margin-right: 8px;
          }
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
export class GrantExternalAccessDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GrantExternalAccessDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  accessForm!: FormGroup;
  isLoading = false;

  availableRoles = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'STAFF', 'VIEWER'];

  ngOnInit(): void {
    this.accessForm = this.fb.group({
      username: ['', Validators.required],
      roles: [[], Validators.required],
      accessNote: [''],
    });
  }

  getRoleIcon(role: string): string {
    switch (role) {
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

      this.snackBar.open('External access granted successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      const message = error?.error?.message || 'Error granting external access';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
