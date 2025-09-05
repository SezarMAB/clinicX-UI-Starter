import {
  Component,
  input,
  signal,
  computed,
  inject,
  effect,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { VisitsService, VisitLogDto, TreatmentStatus } from '@features/visits';
import { PageRequest } from '@core';

interface TimelineGroup {
  month: string;
  year: number;
  treatments: VisitLogDto[];
}

@Component({
  selector: 'app-treatment-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './treatment-timeline.component.html',
  styleUrls: ['./treatment-timeline.component.scss'],
})
export class TreatmentTimelineComponent {
  private readonly treatmentsService = inject(VisitsService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly patientId = input.required<string>();
  readonly showYear = input(true);
  readonly maxItems = input(0); // 0 = show all

  // State
  readonly treatments = signal<VisitLogDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly expandedGroups = signal<Set<string>>(new Set());
  readonly pageRequest = signal<PageRequest>({
    page: 0,
    size: 20,
    sort: ['visitDate,desc'],
  });

  // Computed timeline groups
  readonly timelineGroups = computed(() => {
    const allTreatments = this.treatments();
    const treatments =
      this.maxItems() > 0 ? allTreatments.slice(0, this.maxItems()) : allTreatments;

    // Group treatments by month/year
    const groups = new Map<string, TimelineGroup>();

    treatments.forEach(treatment => {
      const date = new Date(treatment.visitDate);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('en', { month: 'long' });

      if (!groups.has(monthYear)) {
        groups.set(monthYear, {
          month: monthName,
          year: date.getFullYear(),
          treatments: [],
        });
      }

      groups.get(monthYear)!.treatments.push(treatment);
    });

    // Sort groups by date (newest first)
    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateB.getTime() - dateA.getTime();
    });
  });

  readonly hasVisits = computed(() => this.treatments().length > 0);

  constructor() {
    // Load treatments when patient ID changes
    effect(() => {
      const patientId = this.patientId();
      if (patientId) {
        this.loadTreatments(patientId);
      }
    });

    // Expand first group by default when timeline groups change
    effect(() => {
      const groups = this.timelineGroups();
      if (groups.length > 0 && this.expandedGroups().size === 0) {
        const firstGroup = `${groups[0].year}-${groups[0].month}`;
        this.expandedGroups.update(expandedGroups => {
          expandedGroups.add(firstGroup);
          return new Set(expandedGroups);
        });
      }
    });
  }

  private loadTreatments(patientId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.treatmentsService
      .getPatientVisitHistoryObservable(patientId, this.pageRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.treatments.set([...(response.content || [])]);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error loading treatments:', err);
          this.error.set('treatments.error.load_failed');
          this.loading.set(false);
          // Fallback to empty array
          this.treatments.set([]);
        },
      });
  }

  toggleGroup(group: TimelineGroup): void {
    const key = `${group.year}-${group.month}`;
    this.expandedGroups.update(groups => {
      if (groups.has(key)) {
        groups.delete(key);
      } else {
        groups.add(key);
      }
      return new Set(groups);
    });
  }

  isGroupExpanded(group: TimelineGroup): boolean {
    const key = `${group.year}-${group.month}`;
    return this.expandedGroups().has(key);
  }

  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      PLANNED: 'schedule',
      IN_PROGRESS: 'pending',
      COMPLETED: 'check_circle',
      CANCELLED: 'cancel',
    };
    return statusIcons[status] || 'help';
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en', {
      day: 'numeric',
      weekday: 'short',
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onViewAllTreatments(): void {
    // Navigate to full treatments list
    console.log('Navigate to treatments list for patient:', this.patientId());
  }

  onTreatmentClick(treatment: VisitLogDto): void {
    // Handle treatment click - could open details dialog or navigate
    console.log('Treatment clicked:', treatment);
    // TODO: Emit event or open dialog for treatment details
  }
}
