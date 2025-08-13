import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TenantUserDto } from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-delete-confirm',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">warning</mat-icon>
      Confirm Deletion
    </h2>

    <mat-dialog-content>
      <div class="warning-content">
        @if (data.message) {
          <p>{{ data.message }}</p>
        } @else {
          <p>Are you sure you want to permanently delete this user?</p>

          <div class="user-details">
            <div class="detail-row">
              <span class="label">Username:</span>
              <span class="value">{{ data.username }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">{{ data.firstName }} {{ data.lastName }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">{{ data.email }}</span>
            </div>
            @if (data.roles && data.roles.length > 0) {
              <div class="detail-row">
                <span class="label">Roles:</span>
                <span class="value">{{ data.roles.join(', ') }}</span>
              </div>
            }
          </div>

          <div class="consequences">
            <h3>
              <mat-icon>info</mat-icon>
              This action will:
            </h3>
            <ul>
              <li>Permanently remove the user from the system</li>
              <li>Delete all user data and access permissions</li>
              <li>Remove the user from all assigned roles</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        <mat-icon>delete</mat-icon>
        Delete User
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #f44336;

        mat-icon {
          font-size: 28px;
          height: 28px;
          width: 28px;
        }
      }

      .warning-content {
        min-width: 400px;

        > p:first-child {
          font-size: 16px;
          margin-bottom: 20px;
        }
      }

      .user-details {
        background-color: #f5f5f5;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 20px;

        .detail-row {
          display: flex;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            font-weight: 500;
            min-width: 100px;
            color: rgba(0, 0, 0, 0.87);
          }

          .value {
            color: rgba(0, 0, 0, 0.6);
          }
        }
      }

      .consequences {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        padding: 12px;

        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #856404;

          mat-icon {
            font-size: 20px;
            height: 20px;
            width: 20px;
          }
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            color: #856404;
            margin-bottom: 4px;
            font-size: 13px;
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
export class TenantUserDeleteConfirmDialog {
  private dialogRef = inject(MatDialogRef<TenantUserDeleteConfirmDialog>);
  data = inject<TenantUserDto & { message?: string }>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
