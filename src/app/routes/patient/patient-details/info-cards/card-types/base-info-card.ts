import { Directive, input, output, InputSignal, OutputEmitterRef } from '@angular/core';
import { PatientSummaryDto } from '@features/patients/patients.models';

/**
 * Base interface for all info card components
 */
export interface InfoCardComponent<T = any> {
  patient: InputSignal<PatientSummaryDto>;
  data: InputSignal<T | undefined>;
  cardClick: OutputEmitterRef<void>;
  actionClick: OutputEmitterRef<void>;
  onCardClick: () => void;
  onActionClick: () => void;
}

/**
 * Base directive for info cards with common inputs/outputs
 */
@Directive()
export abstract class BaseInfoCard<T = any> implements InfoCardComponent<T> {
  // Required inputs
  readonly patient = input.required<PatientSummaryDto>();

  // Optional generic data input for card-specific data
  readonly data = input<T>();

  // Event outputs
  readonly cardClick = output<void>();
  readonly actionClick = output<void>();

  // Abstract methods to be implemented by child components
  abstract onCardClick(): void;
  abstract onActionClick(): void;

  // Common method to handle card click
  handleCardClick(): void {
    this.cardClick.emit();
    this.onCardClick();
  }

  // Common method to handle action button click
  handleActionClick(event: Event): void {
    event.stopPropagation();
    this.actionClick.emit();
    this.onActionClick();
  }
}
