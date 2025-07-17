/**
 * Invoice and financial-related models and DTOs
 * Generated from OpenAPI specification
 */

/**
 * Financial record status enum
 * @enum FinancialStatus
 */
export enum FinancialStatus {
  OPEN = 'OPEN',
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * Invoice item request
 * @interface InvoiceItemRequest
 */
export interface InvoiceItemRequest {
  /** Procedure ID */
  procedureId: string;
  /** Quantity */
  quantity?: number;
  /** Unit price */
  unitPrice: number;
  /** Description (max 200 chars) */
  description?: string;
}

/**
 * Invoice creation request
 * @interface InvoiceCreateRequest
 */
export interface InvoiceCreateRequest {
  /** Patient ID */
  patientId: string;
  /** Invoice date */
  invoiceDate: string;
  /** Due date */
  dueDate: string;
  /** Invoice items */
  items: InvoiceItemRequest[];
  /** Notes (max 500 chars) */
  notes?: string;
}

/**
 * Payment creation request
 * @interface PaymentCreateRequest
 */
export interface PaymentCreateRequest {
  /** Payment amount */
  amount: number;
  /** Payment date */
  paymentDate: string;
  /** Payment method (max 50 chars) */
  paymentMethod: string;
  /** Notes (max 500 chars) */
  notes?: string;
  /** Reference number (max 100 chars) */
  referenceNumber?: string;
}

/**
 * Payment installment DTO
 * @interface PaymentInstallmentDto
 */
export interface PaymentInstallmentDto {
  /** Description */
  description?: string;
  /** Payment date */
  paymentDate?: string;
  /** Amount */
  amount?: number;
}

/**
 * Financial record DTO
 * @interface FinancialRecordDto
 */
export interface FinancialRecordDto {
  /** Record ID */
  recordId: string;
  /** Invoice number */
  invoiceNumber?: string;
  /** Issue date */
  issueDate?: string;
  /** Due date */
  dueDate?: string;
  /** Amount */
  amount?: number;
  /** Status */
  status?: FinancialStatus;
  /** Payment installments */
  installments?: PaymentInstallmentDto[];
}
