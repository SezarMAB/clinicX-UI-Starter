import { Component, input, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

import { PatientsService } from '@features/patients/patients.service';
import { PatientSummaryDto } from '@features/patients/patients.models';

import { PatientSummaryComponent } from './patient-summary/patient-summary.component';
import { InfoCardsComponent } from './info-cards/info-cards.component';
import { PatientTabsComponent } from './patient-tabs/patient-tabs.component';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
    PatientSummaryComponent,
    InfoCardsComponent,
    PatientTabsComponent,
  ],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.scss',
})
export class PatientDetailsComponent {
  /*------------- Input Signals -------------*/
  patientId = input<string | null>(null);
  noPadding = input<boolean>(true);

  /*------------- DI -------------*/
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);

  /*------------- UI state -------------*/
  patient = signal<PatientSummaryDto | null>(null);
  isLoading = signal(false);

  /*------------- اختـيار المعرِّف (input > route) -------------*/
  private routeId = toSignal(this.route.paramMap.pipe(map(m => m.get('id'))), {
    initialValue: null,
  });
  private selectedId = computed(() => this.patientId() ?? this.routeId());

  /*------------- Resource - created in injection context -------------*/
  // Create a computed signal that filters out null values
  private validSelectedId = computed(() => {
    const id = this.selectedId();
    return id || 'dummy-id'; // Use a dummy ID when null to avoid errors
  });

  private patientResource = this.patientsService.getPatientById(this.validSelectedId);

  constructor() {
    /* تحديث حالة التحميل والبيانات بناءً على الريسورس */
    effect(() => {
      const id = this.selectedId();
      if (!id) {
        this.patient.set(null);
        this.isLoading.set(false);
        return;
      }

      // Don't process if we're using the dummy ID
      if (this.validSelectedId() === 'dummy-id') {
        this.patient.set(null);
        this.isLoading.set(false);
        return;
      }

      /* أربط سيغنال التحميل مباشرة */
      this.isLoading.set(this.patientResource.isLoading());

      /* خطأ؟ */
      if (this.patientResource.error()) {
        console.error('Error loading patient:', this.patientResource.error());
        this.mockPatientData();
        return;
      }

      /* ناجح؟ */
      const data = this.patientResource.value();
      if (data) {
        this.patient.set(data);
      }
    });
  }

  /*------------- بيانات تجريبية عند فشل الـ API -------------*/
  private mockPatientData(): void {
    const mockPatient: PatientSummaryDto = {
      id: '1',
      publicFacingId: '2478',
      fullName: 'ريما الحمصي',
      dateOfBirth: '1989-01-31',
      gender: 'FEMALE',
      phoneNumber: '+49 123 90806700',
      email: 'rima.homsi@email.com',
      address: 'شارع الزهور، مبنى 5، برلين',
      hasAlert: true,
      balance: -2450,
      age: 35,
      insuranceProvider: 'تأمين الشام الصحي',
      insuranceNumber: 'SN-8573920',
      importantMedicalNotes: 'حساسية من البنسلين',
    };

    this.patient.set(mockPatient);
    this.isLoading.set(false);
  }
}
