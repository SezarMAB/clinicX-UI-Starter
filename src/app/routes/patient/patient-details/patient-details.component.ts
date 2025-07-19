import { Component, input, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

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
    PatientSummaryComponent,
    InfoCardsComponent,
    PatientTabsComponent,
  ],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.css',
})
export class PatientDetailsComponent {
  /*------------- Input Signals -------------*/
  patientId = input<string | null>(null);
  noPadding = input<boolean>(false);

  /*------------- DI -------------*/
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);

  /*------------- UI state -------------*/
  patient = signal<PatientSummaryDto | null>(null);
  isLoading = signal(false);

  /*------------- اختـيار المعرِّف (input > route) -------------*/
  private routeId = toSignal(this.route.paramMap.pipe(map(m => m.get('id'))), {
    initialValue: null,
  });
  private selectedId = computed(() => this.patientId() ?? this.routeId());

  constructor() {
    /* كلما تغيَّر المعرّف، طلِّع ريسورس جديد وتعامل مع حالتو */
    effect(() => {
      const id = this.selectedId();
      if (!id) {
        this.patient.set(null);
        return;
      }

      /* HttpResourceRef<PatientSummaryDto> */
      const res = this.patientsService.getPatientById(id);

      /* أربط سيغنال التحميل مباشرة */
      this.isLoading.set(res.isLoading());

      /* خطأ؟ */
      if (res.error()) {
        console.error('Error loading patient:', res.error());
        this.mockPatientData();
        return;
      }

      /* ناجح؟ */
      const data = res.value();
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
