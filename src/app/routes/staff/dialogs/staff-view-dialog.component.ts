import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffDto } from '../../../features/staff/staff.models';
import { StaffEditDialogComponent } from './staff-edit-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-staff-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
  ],
  providers: [MatSnackBar],
  templateUrl: './staff-view-dialog.component.html',
  styleUrls: ['./staff-view-dialog.component.scss'],
})
export class StaffViewDialogComponent {
  public readonly dialogRef = inject(MatDialogRef<StaffViewDialogComponent>);
  public readonly staff = inject<StaffDto>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  close(): void {
    this.dialogRef.close();
  }

  async openEditDialog(): Promise<void> {
    const editDialogRef = this.dialog.open(StaffEditDialogComponent, {
      width: '800px',
      data: { staff: this.staff, isNew: false },
      disableClose: true,
    });

    const result = await firstValueFrom(editDialogRef.afterClosed());
    if (result) {
      // Update the current staff data with the result
      Object.assign(this.staff, result);
      this.snackBar.open('Staff member updated successfully', 'Close', { duration: 3000 });
      // Close the view dialog to refresh the parent list
      this.dialogRef.close(result);
    }
  }
}
