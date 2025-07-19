import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PatientSummaryDto } from '@features/patients/patients.models';

@Component({
  selector: 'app-patient-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatTooltipModule],
  templateUrl: './patient-summary.component.html',
  styleUrls: ['./patient-summary.component.scss'],
})
export class PatientSummaryComponent {
  @Input({ required: true }) patient!: PatientSummaryDto;

  // Mock data for demonstration
  patientTags = ['JSC', 'AMS', 'BND'];

  formatDate(date: string): string {
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
