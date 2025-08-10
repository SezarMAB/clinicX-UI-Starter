import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Empty state component for when no data is available
 * Provides visual feedback and optional action button
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      @if (showAction) {
        <button mat-raised-button color="primary" (click)="action.emit()">
          <mat-icon>add</mat-icon>
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        text-align: center;
        min-height: 400px;
      }

      .empty-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: var(--mat-disabled-text);
        margin-bottom: 1rem;
      }

      .empty-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 400;
        color: var(--mat-primary-text);
      }

      .empty-message {
        margin: 0.5rem 0 1.5rem;
        color: var(--mat-secondary-text);
        max-width: 400px;
      }

      button {
        mat-icon {
          margin-right: 0.25rem;
        }
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No data available';
  @Input() message: string = 'There are no items to display at this time.';
  @Input() showAction: boolean = false;
  @Input() actionLabel: string = 'Add Item';
  @Output() action = new EventEmitter<void>();
}
