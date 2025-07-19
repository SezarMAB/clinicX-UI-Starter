import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { PatientSummaryDto } from '@features/patients/patients.models';

interface NextAppointment {
  date: string;
  time: string;
  doctor: string;
}

interface TreatmentStats {
  total: number;
  lastVisit: string | null;
}

@Component({
  selector: 'app-info-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './info-cards.component.html',
  styleUrls: ['./info-cards.component.scss'],
})
export class InfoCardsComponent implements OnInit {
  @Input({ required: true }) patient!: PatientSummaryDto;

  @Output() viewTransactionsClick = new EventEmitter<void>();
  @Output() viewAppointmentsClick = new EventEmitter<void>();
  @Output() viewInsuranceClick = new EventEmitter<void>();
  @Output() viewTreatmentsClick = new EventEmitter<void>();
  @Output() editNotesClick = new EventEmitter<void>();

  private router = inject(Router);

  // Mock data - should be loaded from services
  nextAppointment: NextAppointment | null = null;
  treatmentStats: TreatmentStats = {
    total: 0,
    lastVisit: null,
  };

  ngOnInit(): void {
    // Load appointment and treatment data
    this.loadPatientStats();
  }

  private loadPatientStats(): void {
    // Mock data - replace with actual service calls
    this.nextAppointment = {
      date: '25.12.2024',
      time: '14:30',
      doctor: 'د. أحمد محمد',
    };

    this.treatmentStats = {
      total: 12,
      lastVisit: '15.11.2024',
    };
  }

  viewTransactions(): void {
    this.viewTransactionsClick.emit();
    this.router.navigate(['/patients', this.patient.id, 'transactions']);
  }

  viewAppointments(): void {
    this.viewAppointmentsClick.emit();
    this.router.navigate(['/patients', this.patient.id, 'appointments']);
  }

  viewInsurance(): void {
    this.viewInsuranceClick.emit();
    this.router.navigate(['/patients', this.patient.id, 'insurance']);
  }

  viewTreatments(): void {
    this.viewTreatmentsClick.emit();
    this.router.navigate(['/patients', this.patient.id, 'treatments']);
  }

  editMedicalNotes(): void {
    this.editNotesClick.emit();
    // Open edit dialog or navigate to edit page
    this.router.navigate(['/patients', this.patient.id, 'edit'], {
      queryParams: { section: 'medical-notes' },
    });
  }
}
