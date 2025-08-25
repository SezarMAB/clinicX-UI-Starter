/** Patient financial summary DTO */
export interface PatientFinancialSummaryDto {
  readonly patientId: string; // UUID
  readonly patientName: string;
  readonly totalInvoiced: number;
  readonly totalPaid: number;
  readonly outstandingBalance: number;
  readonly creditBalance: number;
  readonly lastPaymentDate?: string; // ISO 8601 date
  readonly lastInvoiceDate?: string; // ISO 8601 date
}

/** Patient with outstanding balance */
export interface PatientWithOutstandingBalance {
  readonly patientId: string; // UUID
  readonly patientName: string;
  readonly outstandingBalance: number;
  readonly lastInvoiceDate?: string; // ISO 8601 date
  readonly daysPastDue?: number;
}
