import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  StaffDto,
  StaffRole,
  StaffCreateRequest,
  StaffUpdateRequest,
} from '../../../features/staff/staff.models';
import { StaffService } from '../../../features/staff/staff.service';

@Component({
  selector: 'app-staff-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
  ],
  templateUrl: './staff-edit-dialog.component.html',
  styleUrls: ['./staff-edit-dialog.component.scss'],
})
export class StaffEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly staffService = inject(StaffService);
  public readonly dialogRef = inject(MatDialogRef<StaffEditDialogComponent>);
  public readonly data = inject<{ staff?: StaffDto; isNew: boolean }>(MAT_DIALOG_DATA);

  form: FormGroup;
  isSaving = signal(false);
  staffRoles = Object.values(StaffRole);
  showKeycloakFields = signal(false);

  constructor() {
    this.form = this.createForm();
    if (!this.data.isNew && this.data.staff) {
      this.loadStaffData(this.data.staff);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      role: [StaffRole.RECEPTIONIST, Validators.required],
      isActive: [true],
      specialtyIds: [[]],
      keycloakLinked: [false],
      keycloakUserId: [''],
      keycloakUsername: [''],
    });
  }

  private loadStaffData(staff: StaffDto): void {
    this.form.patchValue({
      fullName: staff.fullName,
      email: staff.email,
      phoneNumber: staff.phoneNumber || '',
      role: staff.role,
      isActive: staff.isActive,
      specialtyIds: staff.specialties?.map(s => s.id) || [],
      keycloakLinked: !!staff.keycloakUserId,
      keycloakUserId: staff.keycloakUserId || '',
      keycloakUsername: '',
    });
    this.showKeycloakFields.set(!!staff.keycloakUserId);
  }

  onKeycloakToggle(checked: boolean): void {
    this.showKeycloakFields.set(checked);
    if (!checked) {
      this.form.patchValue({
        keycloakUserId: '',
        keycloakUsername: '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isSaving.set(true);
    const formValue = this.form.value;

    const staffData = {
      ...formValue,
      specialtyIds: this.data.staff?.specialties?.map(s => s.id) || [],
    };

    const request$ = this.data.isNew
      ? this.staffService.createStaff(staffData as StaffCreateRequest)
      : this.staffService.updateStaff(this.data.staff!.id, staffData as StaffUpdateRequest);

    request$.subscribe({
      next: result => {
        this.dialogRef.close(result);
      },
      error: error => {
        console.error('Error saving staff:', error);
        this.isSaving.set(false);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
