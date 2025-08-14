import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';

import { UserType } from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-advanced-search',
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
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
  ],
  templateUrl: './tenant-user-advanced-search.dialog.html',
  styleUrls: ['./tenant-user-advanced-search.dialog.scss'],
})
export class TenantUserAdvancedSearchDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserAdvancedSearchDialog>);
  data = inject<any>(MAT_DIALOG_DATA) || {};

  searchForm: FormGroup;
  userTypes = Object.values(UserType);
  availableRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'STAFF', 'VIEWER'];

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [this.data.searchTerm || ''],
      userType: [this.data.userType || null],
      enabled: [this.data.enabled ?? null],
      roles: [this.data.roles || []],
      createdAfter: [this.data.createdAfter || null],
      createdBefore: [this.data.createdBefore || null],
      lastLoginAfter: [this.data.lastLoginAfter || null],
      lastLoginBefore: [this.data.lastLoginBefore || null],
      includeExternal: [this.data.includeExternal ?? true],
      emailVerified: [this.data.emailVerified ?? null],
      hasNeverLoggedIn: [this.data.hasNeverLoggedIn ?? false],
    });
  }

  getActiveFiltersCount(): number {
    const values = this.searchForm.value;
    let count = 0;

    if (values.searchTerm) count++;
    if (values.userType !== null) count++;
    if (values.enabled !== null) count++;
    if (values.roles?.length > 0) count++;
    if (values.createdAfter) count++;
    if (values.createdBefore) count++;
    if (values.lastLoginAfter) count++;
    if (values.lastLoginBefore) count++;
    if (!values.includeExternal) count++;
    if (values.emailVerified !== null) count++;
    if (values.hasNeverLoggedIn) count++;

    return count;
  }

  getActiveFilters(): { key: string; label: string; value: string }[] {
    const values = this.searchForm.value;
    const filters: { key: string; label: string; value: string }[] = [];

    if (values.searchTerm) {
      filters.push({ key: 'searchTerm', label: 'Search', value: values.searchTerm });
    }
    if (values.userType !== null) {
      filters.push({ key: 'userType', label: 'Type', value: values.userType });
    }
    if (values.enabled !== null) {
      filters.push({
        key: 'enabled',
        label: 'Status',
        value: values.enabled ? 'Enabled' : 'Disabled',
      });
    }
    if (values.roles?.length > 0) {
      filters.push({ key: 'roles', label: 'Roles', value: values.roles.join(', ') });
    }
    if (values.createdAfter) {
      filters.push({
        key: 'createdAfter',
        label: 'Created After',
        value: values.createdAfter.toLocaleDateString(),
      });
    }
    if (values.createdBefore) {
      filters.push({
        key: 'createdBefore',
        label: 'Created Before',
        value: values.createdBefore.toLocaleDateString(),
      });
    }
    if (!values.includeExternal) {
      filters.push({ key: 'includeExternal', label: 'Access', value: 'Internal Only' });
    }

    return filters;
  }

  onClear(): void {
    this.searchForm.reset({
      includeExternal: true,
      emailVerified: null,
      hasNeverLoggedIn: false,
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSearch(): void {
    const values = this.searchForm.value;

    // Clean up null/undefined values
    const result: any = {};
    Object.keys(values).forEach(key => {
      if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
        if (key.includes('Date') && values[key]) {
          result[key] = values[key].toISOString();
        } else {
          result[key] = values[key];
        }
      }
    });

    this.dialogRef.close(result);
  }
}
