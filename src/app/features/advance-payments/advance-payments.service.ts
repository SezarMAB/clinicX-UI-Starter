import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  AdvancePaymentDto,
  AdvancePaymentCreateRequest,
  ApplyAdvancePaymentRequest,
  PatientCreditBalance,
  PageAdvancePaymentDto,
} from './advance-payments.models';

/**
 * Service for managing advance payments
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class AdvancePaymentsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get patient advance payments
   * @param patientId Signal containing the patient ID
   * @param pageable Optional pageable parameters
   */
  getPatientAdvancePayments(patientId: Signal<string>, pageable?: Signal<Record<string, unknown>>) {
    return this.apiService.apiGetResource<PageAdvancePaymentDto>(
      computed(() => `/api/v1/advance-payments/patient/${patientId()}`),
      pageable ? { params: pageable } : undefined
    );
  }

  /**
   * Get unapplied advance payments for a patient
   * @param patientId Signal containing the patient ID
   * @param pageable Optional pageable parameters
   */
  getUnappliedAdvancePayments(
    patientId: Signal<string>,
    pageable?: Signal<Record<string, unknown>>
  ) {
    return this.apiService.apiGetResource<PageAdvancePaymentDto>(
      computed(() => `/api/v1/advance-payments/patient/${patientId()}/unapplied`),
      pageable ? { params: pageable } : undefined
    );
  }

  /**
   * Get patient credit balance
   * @param patientId Signal containing the patient ID
   */
  getPatientCreditBalance(patientId: Signal<string>) {
    return this.apiService.apiGetResource<PatientCreditBalance>(
      computed(() => `/api/v1/advance-payments/patient/${patientId()}/balance`)
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create advance payment
   * @param request Advance payment data
   * @returns Observable of the created advance payment
   */
  createAdvancePayment(request: AdvancePaymentCreateRequest): Observable<AdvancePaymentDto> {
    return this.apiService.post<AdvancePaymentDto>('/api/v1/advance-payments', request);
  }

  /**
   * Apply advance payment to invoice
   * @param request Apply payment request
   * @returns Observable of the application result
   */
  applyAdvancePaymentToInvoice(request: ApplyAdvancePaymentRequest): Observable<unknown> {
    return this.apiService.post('/api/v1/advance-payments/apply', request);
  }

  /**
   * Auto-apply advance payments to invoice
   * @param invoiceId Invoice ID
   * @returns Observable of the application result
   */
  autoApplyAdvancePaymentsToInvoice(invoiceId: string): Observable<unknown> {
    return this.apiService.post(`/api/v1/advance-payments/invoice/${invoiceId}/auto-apply`, {});
  }
}
