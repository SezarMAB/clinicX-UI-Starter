import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import {
  TenantUserDto,
  UserType,
} from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './tenant-user-view-dialog.component.html',
  styleUrls: ['./tenant-user-view-dialog.component.scss'],
})
export class TenantUserViewDialogComponent {
  private dialogRef = inject(MatDialogRef<TenantUserViewDialogComponent>);
  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  getUserTypeColor(userType?: UserType | any): string {
    if (!userType) return '';

    // Handle UserType enum values
    if (userType === 'INTERNAL' || userType === UserType.INTERNAL) {
      return 'primary';
    }
    if (userType === 'EXTERNAL' || userType === UserType.EXTERNAL) {
      return 'accent';
    }
    if (userType === 'SUPER_ADMIN' || userType === UserType.SUPER_ADMIN) {
      return 'warn';
    }

    // Handle StaffRole values
    if (userType === 'ADMIN') return 'warn';
    if (userType === 'DOCTOR') return 'primary';
    if (userType === 'NURSE') return 'accent';

    return '';
  }

  getRoleBadgeColor(role: string): string {
    if (role.includes('ADMIN')) return 'warn';
    if (role.includes('DOCTOR')) return 'primary';
    if (role.includes('NURSE')) return 'accent';
    return '';
  }

  getAttributeEntries(): { key: string; values: readonly string[] }[] {
    if (!this.data.attributes) return [];
    return Object.entries(this.data.attributes).map(([key, values]) => ({
      key,
      values: values || [],
    }));
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.dialogRef.close({ action: 'edit', user: this.data });
  }

  onResetPassword(): void {
    this.dialogRef.close({ action: 'resetPassword', user: this.data });
  }
}
