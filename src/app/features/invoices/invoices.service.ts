import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import {
  InvoiceDto,
  InvoiceCreateRequest,
  PaymentCreateRequest,
  NextInvoiceNumberResponse,
  PatientBalanceResponse,
} from './invoices.models';

/**
 * Service for managing invoices and payments
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST operations
 */
@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get patient financial records (invoices)
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientFinancialRecords(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<InvoiceDto[]>(
      computed(() => `/api/v1/invoices/patient/${patientId()}`),
      { params: computed(() => pageRequest() as Record<string, unknown>) }
    );
  }

  /**
   * Get next invoice number
   */
  getNextInvoiceNumber() {
    return this.apiService.apiGetResource<NextInvoiceNumberResponse>(
      '/api/v1/invoices/next-invoice-number'
    );
  }

  // --- POST Operations (Observables) ---

  /**
   * Create new invoice
   * @param request Invoice creation data
   * @returns Observable of created invoice
   */
  createInvoice(request: InvoiceCreateRequest): Observable<InvoiceDto> {
    return this.apiService.post<InvoiceDto>('/api/v1/invoices', request);
  }

  /**
   * Add payment to invoice
   * @param invoiceId Invoice ID
   * @param request Payment data
   * @returns Observable of payment result
   */
  addPayment(invoiceId: string, request: PaymentCreateRequest): Observable<InvoiceDto> {
    return this.apiService.post<InvoiceDto>(`/api/v1/invoices/${invoiceId}/payments`, request);
  }

  /**
   * Recalculate patient balance
   * @param patientId Patient ID
   * @returns Observable of balance result
   */
  recalculatePatientBalance(patientId: string): Observable<PatientBalanceResponse> {
    return this.apiService.post<PatientBalanceResponse>(
      `/api/v1/invoices/patient/${patientId}/recalculate-balance`,
      {}
    );
  }
}
