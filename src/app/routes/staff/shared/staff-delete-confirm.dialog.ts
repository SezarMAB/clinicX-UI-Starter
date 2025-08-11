import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { StaffDto } from '../../../features/staff/staff.models';

@Component({
  selector: 'app-staff-delete-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Delete</h2>
    <mat-dialog-content>
      <p>
        Are you sure you want to delete the staff member <strong>{{ data.fullName }}</strong
        >?
      </p>
      <p class="warning-text">This action will deactivate the staff member and cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning-text {
        color: var(--mat-warn-text);
        font-size: 0.875rem;
        margin-top: 8px;
      }
    `,
  ],
})
export class StaffDeleteConfirmDialog {
  readonly dialogRef = inject(MatDialogRef<StaffDeleteConfirmDialog>);
  readonly data = inject<StaffDto>(MAT_DIALOG_DATA);
}
