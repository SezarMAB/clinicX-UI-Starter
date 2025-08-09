import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Advance payment DTO */
export interface AdvancePaymentDto {
  readonly id: string; // UUID
  readonly patientId: string; // UUID
  readonly amount: number;
  readonly paymentDate: string; // ISO 8601 date-time
  readonly paymentMethod: string;
  readonly notes?: string;
  readonly appliedAmount: number;
  readonly remainingAmount: number;
  readonly status: string;
  readonly createdAt: string; // ISO 8601 date-time
}

/** Request to create advance payment */
export interface AdvancePaymentCreateRequest {
  readonly patientId: string; // UUID
  readonly amount: number;
  readonly paymentDate: string; // ISO 8601 date-time
  readonly paymentMethod: string;
  readonly notes?: string;
}

/** Request to apply advance payment to invoice */
export interface ApplyAdvancePaymentRequest {
  readonly advancePaymentId: string; // UUID
  readonly invoiceId: string; // UUID
  readonly amount: number;
}

/** Patient credit balance response */
export interface PatientCreditBalance {
  readonly patientId: string; // UUID
  readonly totalCreditBalance: number;
  readonly currency: string;
}

/** Paginated advance payment response */
export type PageAdvancePaymentDto = PageResponse<AdvancePaymentDto>;
