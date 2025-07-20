import { Type } from '@angular/core';
import { BaseInfoCard } from './base-info-card';
import { BalanceCardComponent } from './balance-card.component';
import { AppointmentsCardComponent } from './appointments-card.component';
import { TreatmentsCardComponent } from './treatments-card.component';
import { MedicalNotesCardComponent } from './medical-notes-card.component';
import { InsuranceCardComponent } from './insurance-card.component';

export type CardType = 'balance' | 'appointments' | 'treatments' | 'medical-notes' | 'insurance';

export interface CardConfig {
  type: CardType;
  component: Type<BaseInfoCard>;
  order?: number;
}

export const CARD_REGISTRY: Record<CardType, Type<BaseInfoCard>> = {
  'balance': BalanceCardComponent,
  'appointments': AppointmentsCardComponent,
  'treatments': TreatmentsCardComponent,
  'medical-notes': MedicalNotesCardComponent,
  'insurance': InsuranceCardComponent,
};

export const DEFAULT_CARD_CONFIG: CardConfig[] = [
  { type: 'balance', component: BalanceCardComponent, order: 1 },
  { type: 'appointments', component: AppointmentsCardComponent, order: 2 },
  { type: 'treatments', component: TreatmentsCardComponent, order: 3 },
  { type: 'medical-notes', component: MedicalNotesCardComponent, order: 4 },
  // { type: 'insurance', component: InsuranceCardComponent, order: 5 },
];
