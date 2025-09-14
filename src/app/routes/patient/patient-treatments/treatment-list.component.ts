import {
  Component,
  Input,
  signal,
  computed,
  inject,
  effect,
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

import { TreatmentsService, TreatmentResponse } from '@features/treatments';
import { PageRequest } from '@core';

interface TreatmentGroup {
  month: string;
  year: number;
  treatments: TreatmentResponse[];
}

@Component({
  selector: 'app-treatment-list',
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
  templateUrl: './treatment-list.component.html',
  styleUrls: ['./treatment-list.component.scss'],
})
export class TreatmentListComponent {
  private readonly patientIdSig = signal<string>('');
  @Input({ required: true }) set patientId(value: string) {
    this.patientIdSig.set(value);
  }

  private readonly treatmentsService = inject(TreatmentsService);

  // State
  readonly treatments = signal<TreatmentResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly expandedGroups = signal<Set<string>>(new Set());
  readonly pageRequest = signal<PageRequest>({
    page: 0,
    size: 50, // Show more treatments for timeline view
    sort: ['startDate,desc', 'createdAt,desc'],
  });

  // Computed timeline groups
  readonly treatmentGroups = computed(() => {
    const allTreatments = this.treatments();

    // Group treatments by month/year based on startDate or createdAt
    const groups = new Map<string, TreatmentGroup>();

    allTreatments.forEach(treatment => {
      const date = new Date(treatment.startDate || treatment.createdAt);
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

  // Signal-based resource tied to patientId and paging
  private readonly treatmentsResource = this.treatmentsService.listTreatmentsByPatient(
    this.patientIdSig,
    this.pageRequest
  );

  constructor() {
    // Watch treatments resource and update local state

    effect(() => {
      // Do not trigger backend call until we have a patientId
      const currentPatientId = this.patientIdSig();
      if (!currentPatientId) return;

      const resource = this.treatmentsResource;

      if (resource.isLoading()) {
        this.loading.set(true);
        return;
      }

      if (resource.error()) {
        console.error('Error loading treatments:', resource.error());
        this.error.set('treatments.error.load_failed');
        this.loading.set(false);
        this.treatments.set([]);
        return;
      }

      const page = resource.value();
      if (page) {
        this.treatments.set([...(page.content || [])]);
        this.loading.set(false);
      }
    });

    // Expand first group by default
    effect(() => {
      const groups = this.treatmentGroups();
      if (groups.length > 0 && this.expandedGroups().size === 0) {
        const firstGroup = `${groups[0].year}-${groups[0].month}`;
        this.expandedGroups.update(expandedGroups => {
          expandedGroups.add(firstGroup);
          return new Set(expandedGroups);
        });
      }
    });
  }

  toggleGroup(group: TreatmentGroup): void {
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

  isGroupExpanded(group: TreatmentGroup): boolean {
    const key = `${group.year}-${group.month}`;
    return this.expandedGroups().has(key);
  }

  getStatusIcon(status: string | null): string {
    if (!status) return 'help';
    const statusIcons: Record<string, string> = {
      PLANNED: 'schedule',
      IN_PROGRESS: 'pending',
      COMPLETED: 'check_circle',
      CANCELLED: 'cancel',
    };
    return statusIcons[status] || 'help';
  }

  getStatusClass(status: string | null): string {
    if (!status) return 'status-unknown';
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getTotalCost(treatment: TreatmentResponse): number {
    return treatment.visits.reduce((total, visit) => {
      return (
        total +
        visit.procedures.reduce((visitTotal, procedure) => {
          return visitTotal + (procedure.totalFee || 0);
        }, 0)
      );
    }, 0);
  }

  getTotalProcedures(treatment: TreatmentResponse): number {
    return treatment.visits.reduce((total, visit) => total + visit.procedures.length, 0);
  }

  onTreatmentClick(treatment: TreatmentResponse): void {
    console.log('Treatment clicked:', treatment);
    // TODO: Navigate to treatment details or emit event
  }
}
