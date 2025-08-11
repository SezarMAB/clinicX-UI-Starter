import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StaffRole, StaffSearchCriteria } from '../../../features/staff/staff.models';

@Component({
  selector: 'app-staff-advanced-search-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './staff-advanced-search.dialog.html',
  styleUrls: ['./staff-advanced-search.dialog.scss'],
})
export class StaffAdvancedSearchDialog {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly dialogRef = inject(MatDialogRef<StaffAdvancedSearchDialog>);

  readonly staffRoles = Object.values(StaffRole);

  readonly searchForm = this.fb.group({
    searchTerm: [''],
    role: [null as StaffRole | null],
    specialtyIds: [[] as string[]],
    isActive: [null as boolean | null],
  });

  onSubmit(): void {
    const formValue = this.searchForm.value;

    const criteria: StaffSearchCriteria = {
      ...(formValue.searchTerm && { searchTerm: formValue.searchTerm }),
      ...(formValue.role && { role: formValue.role }),
      ...(formValue.specialtyIds &&
        formValue.specialtyIds.length > 0 && { specialtyIds: formValue.specialtyIds }),
      ...(formValue.isActive !== null && { isActive: formValue.isActive }),
    };

    this.dialogRef.close(criteria);
  }

  onClear(): void {
    this.searchForm.reset();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
