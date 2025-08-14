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
  templateUrl: './tenant-user-delete-confirm.dialog.html',
  styleUrls: ['./tenant-user-delete-confirm.dialog.scss'],
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
