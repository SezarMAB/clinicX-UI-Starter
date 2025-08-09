import { PageResponse } from '../../core/models/pagination.model';

/** Financial status enum */
export type FinancialStatus = 'paid' | 'partial' | 'overdue' | 'pending';

/** Invoice DTO */
export interface InvoiceDto {
  readonly id: string; // UUID
  readonly invoiceNumber: string;
  readonly patientId: string; // UUID
  readonly issueDate: string; // ISO 8601 date
  readonly dueDate: string; // ISO 8601 date
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly remainingAmount: number;
  readonly status: string;
  readonly items: InvoiceItemDto[];
  readonly payments: PaymentDto[];
}

/** Invoice item DTO */
export interface InvoiceItemDto {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

/** Payment DTO */
export interface PaymentDto {
  readonly id: string;
  readonly amount: number;
  readonly paymentDate: string; // ISO 8601 date-time
  readonly paymentMethod: string;
  readonly notes?: string;
}

/** Invoice create request */
export interface InvoiceCreateRequest {
  readonly patientId: string; // UUID
  readonly issueDate: string; // ISO 8601 date
  readonly dueDate: string; // ISO 8601 date
  readonly items: InvoiceItemCreateRequest[];
}

/** Invoice item create request */
export interface InvoiceItemCreateRequest {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

/** Payment create request */
export interface PaymentCreateRequest {
  readonly amount: number;
  readonly paymentDate: string; // ISO 8601 date-time
  readonly paymentMethod: string;
  readonly notes?: string;
}

/** Next invoice number response */
export interface NextInvoiceNumberResponse {
  readonly nextInvoiceNumber: string;
}

/** Patient balance response */
export interface PatientBalanceResponse {
  readonly patientId: string;
  readonly totalBalance: number;
  readonly currency: string;
}
