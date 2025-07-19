import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PatientSummaryDto } from '@features/patients/patients.models';

@Component({
  selector: 'app-info-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './info-cards.component.html',
  styleUrls: ['./info-cards.component.scss'],
})
export class InfoCardsComponent {
  @Input({ required: true }) patient!: PatientSummaryDto;
}
