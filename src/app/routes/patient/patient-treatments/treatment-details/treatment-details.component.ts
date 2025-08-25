import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { TreatmentsService } from '@features/treatments';
import { TreatmentLogDto } from '@features/treatments/treatments.models';
import { TreatmentEditDialogComponent } from '../dialogs/treatment-edit-dialog/treatment-edit-dialog.component';

@Component({
  selector: 'app-treatment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './treatment-details.component.html',
  styleUrls: ['./treatment-details.component.scss'],
})
export class TreatmentDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly translate = inject(TranslateService);
  private readonly toastr = inject(ToastrService);

  // State signals
  treatmentId = signal<string>('');
  patientId = signal<string>('');
  treatment = signal<TreatmentLogDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed values
  statusColor = computed(() => {
    const status = this.treatment()?.status;
    const colors: Record<string, string> = {
      PLANNED: 'primary',
      IN_PROGRESS: 'accent',
      COMPLETED: 'success',
      CANCELLED: 'warn',
    };
    return colors[status || ''] || 'basic';
  });

  statusIcon = computed(() => {
    const status = this.treatment()?.status;
    const icons: Record<string, string> = {
      PLANNED: 'schedule',
      IN_PROGRESS: 'pending',
      COMPLETED: 'check_circle',
      CANCELLED: 'cancel',
    };
    return icons[status || ''] || 'help';
  });

  ngOnInit(): void {
    // Get IDs from route params
    this.route.params.subscribe(params => {
      this.treatmentId.set(params.treatmentId);
      this.patientId.set(params.patientId);
      this.loadTreatmentDetails();
    });
  }

  private loadTreatmentDetails(): void {
    this.loading.set(true);
    this.error.set(null);

    // Create mock treatment for now (replace with actual API call)
    setTimeout(() => {
      const mockTreatment: TreatmentLogDto = {
        // New field names
        treatmentId: this.treatmentId(),
        treatmentDate: new Date().toISOString().split('T')[0],
        treatmentTime: new Date().toTimeString().split(' ')[0],
        visitType: 'Treatment',
        toothNumber: 14,
        treatmentName: 'Root Canal',
        doctorName: 'Dr. John Smith',
        durationMinutes: 90,
        cost: 850,
        status: 'COMPLETED',
        notes: 'Patient tolerated procedure well. No complications.',
        nextAppointment: undefined,
        // Legacy fields for compatibility
        id: this.treatmentId(),
        patientId: this.patientId(),
        treatmentType: 'Root Canal',
        description: 'Complete root canal treatment on tooth #14',
        performedBy: 'Dr. John Smith',
        duration: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.treatment.set(mockTreatment);
      this.loading.set(false);
    }, 500);

    // TODO: Replace with actual API call
    // this.treatmentsService.getTreatmentById(this.treatmentId()).subscribe({
    //   next: (treatment) => {
    //     this.treatment.set(treatment);
    //     this.loading.set(false);
    //   },
    //   error: (error) => {
    //     this.error.set(this.translate.instant('treatments.error.load_failed'));
    //     this.loading.set(false);
    //     console.error('Error loading treatment:', error);
    //   }
    // });
  }

  editTreatment(): void {
    if (!this.treatment()) return;

    const dialogRef = this.dialog.open(TreatmentEditDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        treatment: this.treatment(),
        patientId: this.patientId(),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTreatmentDetails();
        this.toastr.success(this.translate.instant('treatments.messages.updated_successfully'));
      }
    });
  }

  deleteTreatment(): void {
    if (!this.treatment()) return;

    if (confirm(this.translate.instant('treatments.confirm_delete'))) {
      this.treatmentsService.deleteTreatment(this.treatmentId()).subscribe({
        next: () => {
          this.toastr.success(this.translate.instant('treatments.messages.deleted_successfully'));
          this.navigateBack();
        },
        error: error => {
          this.toastr.error(this.translate.instant('treatments.error.delete_failed'));
        },
      });
    }
  }

  printTreatment(): void {
    window.print();
  }

  navigateBack(): void {
    this.router.navigate(['/patients', this.patientId(), 'details']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(input: string | TreatmentLogDto): string {
    if (typeof input === 'string') {
      // Check if it's a time string (HH:mm:ss)
      if (input.includes(':') && !input.includes('T')) {
        return input.substring(0, 5); // Return HH:mm
      }
      // Otherwise treat as datetime
      return new Date(input).toLocaleTimeString();
    }
    // If treatment object, use treatmentTime if available
    const treatment = input as TreatmentLogDto;
    if (treatment.treatmentTime) {
      return treatment.treatmentTime.substring(0, 5);
    }
    if (treatment.treatmentDate) {
      return new Date(treatment.treatmentDate).toLocaleTimeString();
    }
    return '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}${this.translate.instant('common.hours_short')} ${mins}${this.translate.instant('common.minutes_short')}`;
    }
    return `${mins}${this.translate.instant('common.minutes_short')}`;
  }
}
