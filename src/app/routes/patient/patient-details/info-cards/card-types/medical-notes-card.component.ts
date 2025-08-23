import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BaseInfoCard } from './base-info-card';
import { NotesData } from './card-data.interfaces';

@Component({
  selector: 'app-medical-notes-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <mat-card class="info-card clickable" (click)="handleCardClick()">
      <div class="info-card-header">
        <h3 class="info-card-title mat-caption">{{ 'patients.medical_notes' | translate }}</h3>
        <button
          matMiniFab
          class="info-card-action-btn"
          [matTooltip]="'patients.add_note' | translate"
          (click)="handleActionClick($event)"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>
      <mat-card-content class="info-card-content">
        <ul class="info-list">
          @if (recentNotes().length > 0) {
            @for (note of recentNotes(); track note.id; let i = $index) {
              @if (i < 3) {
                <li class="info-list-item">
                  <span class="info-label">{{ note.date }}:</span>
                  <span class="info-value"
                    >{{ note.content | slice: 0 : 50
                    }}{{ note.content.length > 50 ? '...' : '' }}</span
                  >
                </li>
              }
            }
          } @else if (hasImportantNotes()) {
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.notes' | translate }}:</span>
              <span class="info-value">{{ patient().importantMedicalNotes }}</span>
            </li>
          } @else {
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.notes' | translate }}:</span>
              <span class="info-value">{{ 'patients.no_medical_notes' | translate }}</span>
            </li>
          }
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.total_notes' | translate }}:</span>
            <span class="info-value">{{ totalNotes() }}</span>
          </li>
        </ul>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      @import '../info-cards.component.scss';

      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class MedicalNotesCardComponent extends BaseInfoCard<NotesData> {
  private router = inject(Router);

  // Computed values
  hasImportantNotes = computed(() => !!this.patient().importantMedicalNotes);

  // Use data input if available, fallback to empty/mock data
  recentNotes = computed(() => this.data()?.recentNotes ?? []);
  totalNotes = computed(() => this.data()?.totalNotes ?? 0);

  onCardClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'notes']);
  }

  onActionClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'notes', 'new']);
  }
}
