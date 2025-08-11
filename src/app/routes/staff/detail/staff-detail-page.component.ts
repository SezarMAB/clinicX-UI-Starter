import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { DatePipe } from '@angular/common';
import { StaffDto } from '../../../features/staff/staff.models';

@Component({
  selector: 'app-staff-detail-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    DatePipe,
  ],
  templateUrl: './staff-detail-page.component.html',
  styleUrls: ['./staff-detail-page.component.scss'],
})
export class StaffDetailPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly staff: StaffDto | null = this.route.snapshot.data.staff;

  goBack(): void {
    this.router.navigate(['/staff']);
  }

  editStaff(): void {
    if (this.staff) {
      this.router.navigate(['/staff', this.staff.id, 'edit']);
    }
  }
}
