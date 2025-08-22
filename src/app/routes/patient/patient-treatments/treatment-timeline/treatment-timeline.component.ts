import { Component, Input, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { TreatmentLogDto } from '@features/treatments/treatments.models';

interface TimelineGroup {
  month: string;
  year: number;
  treatments: TreatmentLogDto[];
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
    TranslateModule,
  ],
  templateUrl: './treatment-timeline.component.html',
  styleUrls: ['./treatment-timeline.component.scss'],
})
export class TreatmentTimelineComponent implements OnInit {
  @Input({ required: true }) treatments!: TreatmentLogDto[];
  @Input() showYear = true;
  @Input() maxItems = 0; // 0 = show all

  // State
  readonly expandedGroups = signal<Set<string>>(new Set());

  // Computed timeline groups
  readonly timelineGroups = computed(() => {
    const treatments =
      this.maxItems > 0 ? this.treatments.slice(0, this.maxItems) : this.treatments;

    // Group treatments by month/year
    const groups = new Map<string, TimelineGroup>();

    treatments.forEach(treatment => {
      const date = new Date(treatment.treatmentDate);
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

  ngOnInit(): void {
    // Expand first group by default
    if (this.timelineGroups().length > 0) {
      const firstGroup = `${this.timelineGroups()[0].year}-${this.timelineGroups()[0].month}`;
      this.expandedGroups.update(groups => {
        groups.add(firstGroup);
        return new Set(groups);
      });
    }
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
}
