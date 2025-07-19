import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-patient-tabs',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule],
  templateUrl: './patient-tabs.component.html',
  styleUrls: ['./patient-tabs.component.scss'],
})
export class PatientTabsComponent {
  selectedTabIndex = signal(0);

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }
}
