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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>manage_search</mat-icon>
      Advanced Search
    </h2>

    <mat-dialog-content>
      <form [formGroup]="searchForm">
        <div class="form-container">
          <h3>Basic Criteria</h3>

          <mat-form-field appearance="outline">
            <mat-label>Search Term</mat-label>
            <input matInput formControlName="searchTerm" placeholder="Username, email, or name" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>User Type</mat-label>
              <mat-select formControlName="userType">
                <mat-option [value]="null">All Types</mat-option>
                @for (type of userTypes; track type) {
                  <mat-option [value]="type">{{ type }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="enabled">
                <mat-option [value]="null">All</mat-option>
                <mat-option [value]="true">Enabled</mat-option>
                <mat-option [value]="false">Disabled</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <h3>Roles</h3>

          <mat-form-field appearance="outline">
            <mat-label>Has Roles</mat-label>
            <mat-select formControlName="roles" multiple>
              @for (role of availableRoles; track role) {
                <mat-option [value]="role">{{ role }}</mat-option>
              }
            </mat-select>
            <mat-hint>Users with any of these roles</mat-hint>
          </mat-form-field>

          <h3>Date Filters</h3>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Created After</mat-label>
              <input matInput [matDatepicker]="createdAfterPicker" formControlName="createdAfter" />
              <mat-datepicker-toggle
                matIconSuffix
                [for]="createdAfterPicker"
              ></mat-datepicker-toggle>
              <mat-datepicker #createdAfterPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Created Before</mat-label>
              <input
                matInput
                [matDatepicker]="createdBeforePicker"
                formControlName="createdBefore"
              />
              <mat-datepicker-toggle
                matIconSuffix
                [for]="createdBeforePicker"
              ></mat-datepicker-toggle>
              <mat-datepicker #createdBeforePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Last Login After</mat-label>
              <input
                matInput
                [matDatepicker]="lastLoginAfterPicker"
                formControlName="lastLoginAfter"
              />
              <mat-datepicker-toggle
                matIconSuffix
                [for]="lastLoginAfterPicker"
              ></mat-datepicker-toggle>
              <mat-datepicker #lastLoginAfterPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Last Login Before</mat-label>
              <input
                matInput
                [matDatepicker]="lastLoginBeforePicker"
                formControlName="lastLoginBefore"
              />
              <mat-datepicker-toggle
                matIconSuffix
                [for]="lastLoginBeforePicker"
              ></mat-datepicker-toggle>
              <mat-datepicker #lastLoginBeforePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <h3>Additional Options</h3>

          <mat-slide-toggle formControlName="includeExternal">
            Include External Users
          </mat-slide-toggle>

          <mat-slide-toggle formControlName="emailVerified">
            Only Email Verified Users
          </mat-slide-toggle>

          <mat-slide-toggle formControlName="hasNeverLoggedIn"> Never Logged In </mat-slide-toggle>

          @if (getActiveFiltersCount() > 0) {
            <div class="active-filters">
              <h4>Active Filters ({{ getActiveFiltersCount() }})</h4>
              <mat-chip-set>
                @for (filter of getActiveFilters(); track filter.key) {
                  <mat-chip> {{ filter.label }}: {{ filter.value }} </mat-chip>
                }
              </mat-chip-set>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClear()">Clear All</button>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSearch()">
        <mat-icon>search</mat-icon>
        Search
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
        max-height: 70vh;
        overflow-y: auto;
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 0;
      }

      h3 {
        margin: 16px 0 8px 0;
        color: rgba(0, 0, 0, 0.87);
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .row {
        display: flex;
        gap: 16px;

        mat-form-field {
          flex: 1;
        }
      }

      mat-slide-toggle {
        margin: 8px 0;
      }

      .active-filters {
        margin-top: 20px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;

        h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.87);
        }
      }

      ::ng-deep {
        .mat-mdc-form-field {
          width: 100%;
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
