import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import {
  PatientFinancialSummaryDto,
  PatientWithOutstandingBalance,
} from './financial-summaries.models';

/**
 * Service for financial summaries and reporting
 * Provides reactive queries via httpResource for GET operations
 */
@Injectable({ providedIn: 'root' })
export class FinancialSummariesService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get patient financial summary
   * @param patientId Signal containing the patient ID
   */
  getPatientFinancialSummary(patientId: Signal<string>) {
    return this.apiService.apiGetResource<PatientFinancialSummaryDto>(
      computed(() => `/api/v1/financial-summaries/patient/${patientId()}`)
    );
  }

  /**
   * Get patients with outstanding balances
   */
  getPatientsWithOutstandingBalances() {
    return this.apiService.apiGetResource<PatientWithOutstandingBalance[]>(
      '/api/v1/financial-summaries/outstanding-balances'
    );
  }

  /**
   * Get all patient financial summaries
   */
  getAllPatientFinancialSummaries() {
    return this.apiService.apiGetResource<PatientFinancialSummaryDto[]>(
      '/api/v1/financial-summaries/all'
    );
  }
}
