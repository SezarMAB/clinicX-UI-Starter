import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Lightweight skeleton component for table loading state
 * Shows placeholder rows while data is being fetched
 */
@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressBarModule],
  template: `
    <div class="skeleton-container">
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>

      <table mat-table [dataSource]="skeletonData" class="skeleton-table">
        @for (column of columns; track column; let i = $index) {
          <ng-container [matColumnDef]="column">
            <th mat-header-cell *matHeaderCellDef>
              <div class="skeleton-header"></div>
            </th>
            <td mat-cell *matCellDef="let element; let j = index">
              <div class="skeleton-cell">
                <div class="skeleton-line" [style.width.%]="getWidth(i, j)"></div>
              </div>
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns" class="skeleton-row"></tr>
      </table>
    </div>
  `,
  styles: [
    `
      .skeleton-container {
        position: relative;
        min-height: 400px;
      }

      mat-progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
      }

      .skeleton-table {
        width: 100%;
        margin-top: 4px;
      }

      .skeleton-header {
        height: 16px;
        background: linear-gradient(
          90deg,
          var(--mat-skeleton-bg) 0%,
          var(--mat-skeleton-highlight) 50%,
          var(--mat-skeleton-bg) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
        width: 60%;
      }

      .skeleton-cell {
        padding: 0.5rem 0;
      }

      .skeleton-line {
        height: 14px;
        background: linear-gradient(
          90deg,
          var(--mat-skeleton-bg) 0%,
          var(--mat-skeleton-highlight) 50%,
          var(--mat-skeleton-bg) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
        min-width: 40px;
      }

      .skeleton-row {
        &:hover {
          background-color: transparent !important;
        }
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      :host-context(.dark-theme) {
        --mat-skeleton-bg: rgba(255, 255, 255, 0.05);
        --mat-skeleton-highlight: rgba(255, 255, 255, 0.1);
      }

      :host-context(:not(.dark-theme)) {
        --mat-skeleton-bg: rgba(0, 0, 0, 0.08);
        --mat-skeleton-highlight: rgba(0, 0, 0, 0.04);
      }
    `,
  ],
})
export class TableSkeletonComponent implements OnInit {
  @Input() columns: string[] = [];
  @Input() rows: number = 5;

  private widthMap = new Map<string, number>();

  ngOnInit(): void {
    // Pre-generate stable random widths for each cell
    this.generateWidths();
  }

  get skeletonData(): any[] {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ index }));
  }

  private generateWidths(): void {
    // Generate stable random widths once during initialization
    for (let col = 0; col < this.columns.length; col++) {
      for (let row = 0; row < this.rows; row++) {
        const key = `${col}-${row}`;
        // Generate a pseudo-random width based on position
        const seed = (col + 1) * (row + 1);
        const width = 40 + ((seed * 17 + seed * 13) % 50);
        this.widthMap.set(key, width);
      }
    }
  }

  getWidth(columnIndex: number, rowIndex: number): number {
    const key = `${columnIndex}-${rowIndex}`;
    // Return cached width or generate a stable one based on indices
    if (!this.widthMap.has(key)) {
      const seed = (columnIndex + 1) * (rowIndex + 1);
      const width = 40 + ((seed * 17 + seed * 13) % 50);
      this.widthMap.set(key, width);
    }
    return this.widthMap.get(key)!;
  }
}
