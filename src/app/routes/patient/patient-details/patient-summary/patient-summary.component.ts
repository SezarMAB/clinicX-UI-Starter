import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { PatientSummaryDto } from '@features/patients/patients.models';

@Component({
  selector: 'app-patient-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    TranslateModule,
  ],
  templateUrl: './patient-summary.component.html',
  styleUrls: ['./patient-summary.component.scss'],
})
export class PatientSummaryComponent {
  @Input({ required: true }) patient!: PatientSummaryDto;

  @Output() edit = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() scheduleAppointment = new EventEmitter<void>();
  @Output() addPayment = new EventEmitter<void>();
  @Output() viewHistory = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  private router = inject(Router);

  // Mock data for demonstration - should come from patient data
  get patientTags(): string[] {
    const tags: string[] = [];

    // Add tags based on patient conditions
    if (this.patient.balance < 0) {
      tags.push('مديون'); // Debtor
    }
    if (this.patient.hasAlert) {
      tags.push('تنبيه'); // Alert
    }
    if (this.patient.importantMedicalNotes) {
      tags.push('ملاحظات طبية'); // Medical notes
    }

    return tags;
  }

  formatDate(date: string): string {
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  }

  onEdit(): void {
    this.edit.emit();
    // Navigate to edit page
    this.router.navigate(['/patients', 'edit', this.patient.id]);
  }

  onPrint(): void {
    this.print.emit();
    window.print();
  }

  onScheduleAppointment(): void {
    this.scheduleAppointment.emit();
    // Navigate to appointment scheduling
    this.router.navigate(['/appointments', 'new'], {
      queryParams: { patientId: this.patient.id },
    });
  }

  onAddPayment(): void {
    this.addPayment.emit();
    // Navigate to payment page
    this.router.navigate(['/payments', 'new'], {
      queryParams: { patientId: this.patient.id },
    });
  }

  onViewHistory(): void {
    this.viewHistory.emit();
    // Navigate to patient history
    this.router.navigate(['/patients', this.patient.id, 'history']);
  }

  onExport(): void {
    this.export.emit();
    // TODO: Implement export functionality
    console.log('Export patient data:', this.patient.id);
  }
}
