import { Component, Input, computed, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { PatientSummaryDto } from '@features/patients/patients.models';
import { DEFAULT_CARD_CONFIG, CardConfig, CardType, CARD_REGISTRY } from './card-types';

@Component({
  selector: 'app-info-cards',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  template: `
    <div class="info-cards-container">
      <div class="info-cards-grid">
        @for (card of visibleCards(); track card.type) {
          <ng-container *ngComponentOutlet="card.component; inputs: cardInputs()"> </ng-container>
        }
      </div>
    </div>
  `,
  styleUrls: ['./info-cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoCardsComponent implements OnInit {
  @Input({ required: true }) patient!: PatientSummaryDto;
  @Input() enabledCards?: CardType[];
  @Input() cardOrder?: CardType[];

  // Signal to track card configuration
  private cardConfig = signal<CardConfig[]>(DEFAULT_CARD_CONFIG);

  // Computed to get visible and sorted cards
  visibleCards = computed(() => {
    const config = this.cardConfig();
    const enabled = this.enabledCards;

    // Filter by enabled cards if specified
    const filtered = enabled ? config.filter(c => enabled.includes(c.type)) : config;

    // Sort by custom order or default order
    if (this.cardOrder) {
      const orderMap = new Map(this.cardOrder.map((type, index) => [type, index]));
      return filtered.sort((a, b) => {
        const orderA = orderMap.get(a.type) ?? 999;
        const orderB = orderMap.get(b.type) ?? 999;
        return orderA - orderB;
      });
    }

    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  // Computed inputs for all cards
  cardInputs = computed(() => ({
    patient: this.patient,
  }));

  ngOnInit(): void {
    // Initialize with custom configuration if provided
    if (this.enabledCards) {
      this.updateCardConfig(this.enabledCards);
    }
  }

  private updateCardConfig(enabledTypes: CardType[]): void {
    const newConfig = enabledTypes
      .map(type => DEFAULT_CARD_CONFIG.find(c => c.type === type))
      .filter(Boolean) as CardConfig[];

    this.cardConfig.set(newConfig);
  }

  // Public API for dynamic card management
  addCard(type: CardType, order?: number): void {
    const component = CARD_REGISTRY[type];
    if (!component) return;

    const newConfig = [...this.cardConfig()];
    const exists = newConfig.some(c => c.type === type);

    if (!exists) {
      newConfig.push({ type, component, order: order ?? newConfig.length + 1 });
      this.cardConfig.set(newConfig);
    }
  }

  removeCard(type: CardType): void {
    const newConfig = this.cardConfig().filter(c => c.type !== type);
    this.cardConfig.set(newConfig);
  }

  reorderCards(newOrder: CardType[]): void {
    const currentConfig = this.cardConfig();
    const reordered = newOrder
      .map((type, index) => {
        const existing = currentConfig.find(c => c.type === type);
        return existing ? { ...existing, order: index + 1 } : null;
      })
      .filter(Boolean) as CardConfig[];

    this.cardConfig.set(reordered);
  }

  toggleCard(type: CardType): void {
    const exists = this.cardConfig().some(c => c.type === type);
    if (exists) {
      this.removeCard(type);
    } else {
      this.addCard(type);
    }
  }
}
