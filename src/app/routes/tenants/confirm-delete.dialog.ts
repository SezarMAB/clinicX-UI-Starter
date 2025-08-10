import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface DialogData {
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Reusable confirmation dialog component
 * Used for confirming destructive actions like deletion
 */
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">warning</mat-icon>
      {{ data.title }}
    </h2>

    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.itemName) {
        <p class="item-name">
          <strong>{{ data.itemName }}</strong>
        </p>
      }
      <p class="warning-text">
        <mat-icon inline>info</mat-icon>
        This action cannot be undone.
      </p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        <mat-icon>delete</mat-icon>
        {{ data.confirmText || 'Delete' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        mat-icon {
          font-size: 1.5rem;
          height: 1.5rem;
          width: 1.5rem;
        }
      }

      mat-dialog-content {
        min-width: 300px;
        max-width: 500px;

        p {
          margin: 0.5rem 0;
        }

        .item-name {
          padding: 0.5rem;
          background-color: var(--mat-dialog-bg-secondary);
          border-radius: 4px;
          margin: 1rem 0;
        }

        .warning-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--mat-warn);
          font-size: 0.875rem;
          margin-top: 1rem;

          mat-icon {
            font-size: 1rem;
            height: 1rem;
            width: 1rem;
          }
        }
      }

      mat-dialog-actions {
        padding: 1rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    `,
  ],
})
export class ConfirmDeleteDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
