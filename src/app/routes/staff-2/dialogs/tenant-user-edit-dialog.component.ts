import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { TenantUserManagementService } from '../../../features/tenant-user-management/tenant-user-management.service';
import {
  TenantUserDto,
  TenantUserUpdateRequest,
} from '../../../features/tenant-user-management/tenant-user-management.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tenant-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './tenant-user-edit-dialog.component.html',
  styleUrls: ['./tenant-user-edit-dialog.component.scss'],
})
export class TenantUserEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantUserEditDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private tenantUserService = inject(TenantUserManagementService);

  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  editForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    // Extract existing attributes
    const attributes = this.data.attributes || {};
    const department = this.getAttributeValue(attributes, 'department');
    const specialization = this.getAttributeValue(attributes, 'specialization');
    const licenseNumber = this.getAttributeValue(attributes, 'licenseNumber');

    this.editForm = this.fb.group({
      email: [this.data.email, [Validators.email]],
      firstName: [this.data.firstName, [Validators.maxLength(100)]],
      lastName: [this.data.lastName, [Validators.maxLength(100)]],
      phoneNumber: [
        this.data.phoneNumber || this.getAttributeValue(attributes, 'phoneNumber'),
        [Validators.pattern(/^\+?[0-9\-\s]+$/)],
      ],
      enabled: [this.data.enabled],
      attributes: this.fb.group({
        department: [department],
        specialization: [specialization],
        licenseNumber: [licenseNumber],
      }),
    });
  }

  private getAttributeValue(attributes: Record<string, readonly string[]>, key: string): string {
    const values = attributes[key];
    return values && values.length > 0 ? values[0] : '';
  }

  async onSubmit(): Promise<void> {
    if (this.editForm.invalid) return;

    this.isLoading = true;

    try {
      const formValue = this.editForm.value;
      const attributes: Record<string, string> = {};

      // Only include non-empty attributes
      Object.entries(formValue.attributes).forEach(([key, value]) => {
        if (value) {
          attributes[key] = value as string;
        }
      });

      const updateRequest: TenantUserUpdateRequest = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber,
        enabled: formValue.enabled,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      };

      await firstValueFrom(this.tenantUserService.updateUser(this.data.userId!, updateRequest));

      this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open('Error updating user', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
