import { FinancialStatus } from '@features/invoices/invoices.models';

export interface BalanceData {
  currentBalance: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  paymentStatus?: FinancialStatus;
  overdueAmount?: number;
}

export interface AppointmentData {
  nextAppointment?: {
    id: string;
    date: string;
    time: string;
    doctorName: string;
    doctorId: string;
    type: string;
  };
  totalAppointments: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
}

export interface TreatmentData {
  activeTreatments: {
    id: string;
    name: string;
    startDate: string;
    progress: number;
  }[];
  completedTreatments: number;
  totalTreatments: number;
  lastVisitDate?: string;
  nextTreatmentDate?: string;
}

export interface InsuranceData {
  providerId: string;
  providerName: string;
  policyNumber: string;
  coverageType: string;
  coveragePercentage: number;
  validUntil: string;
  remainingBenefit?: number;
  yearlyMaximum?: number;
}

export interface NotesData {
  recentNotes: {
    id: string;
    date: string;
    author: string;
    content: string;
    type: 'general' | 'medical' | 'treatment' | 'billing';
  }[];
  totalNotes: number;
  unreadNotes: number;
}
