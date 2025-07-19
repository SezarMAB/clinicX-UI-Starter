import { Component, Input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-patient-tabs',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: './patient-tabs.component.html',
  styleUrls: ['./patient-tabs.component.scss'],
})
export class PatientTabsComponent implements OnInit {
  @Input({ required: true }) patientId!: string;

  selectedTabIndex = signal(0);
  private dialog = inject(MatDialog);

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    // Could emit event or save preference
    this.saveTabPreference(index);
  }

  expandChart(): void {
    // Open dental chart in full screen dialog
    console.log('Opening dental chart in full screen');
    // TODO: Implement dental chart dialog
    /*
    this.dialog.open(DentalChartDialogComponent, {
      data: { patientId: this.patientId },
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
    });
    */
  }

  private saveTabPreference(index: number): void {
    // Save user's tab preference to localStorage
    localStorage.setItem('patient-details-tab', index.toString());
  }

  ngOnInit(): void {
    // Restore last selected tab from localStorage
    const savedTab = localStorage.getItem('patient-details-tab');
    if (savedTab) {
      this.selectedTabIndex.set(parseInt(savedTab, 10));
    }
  }
}
