import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureFlagService, FeatureCode } from '@core/services/feature-flag.service';

/**
 * Component for conditional rendering based on feature flags
 *
 * Usage:
 * <app-feature-flag feature="DENTAL">
 *   <div>This only shows for dental specialty</div>
 * </app-feature-flag>
 *
 * <app-feature-flag [features]="['DENTAL', 'APPOINTMENTS']" [requireAll]="false">
 *   <div>This shows for dental or appointments</div>
 * </app-feature-flag>
 *
 * <app-feature-flag feature="INVENTORY" [showFallback]="true">
 *   <div>Inventory feature content</div>
 *   <div fallback>This feature is not available for your tenant type</div>
 * </app-feature-flag>
 */
@Component({
  selector: 'app-feature-flag',
  template: `
    @if (shouldShow) {
      <ng-content></ng-content>
    } @else if (showFallback) {
      <ng-content select="[fallback]"></ng-content>
    }
  `,
  standalone: true,
  imports: [CommonModule],
})
export class FeatureFlagComponent {
  private featureFlagService = inject(FeatureFlagService);

  @Input() feature?: FeatureCode;
  @Input() features?: FeatureCode[];
  @Input() requireAll = false;
  @Input() showFallback = false;

  get shouldShow(): boolean {
    const requiredFeatures = this.features || (this.feature ? [this.feature] : []);

    if (requiredFeatures.length === 0) {
      return true; // No features specified, always show
    }

    return this.requireAll
      ? this.featureFlagService.hasAllFeatures(...requiredFeatures)
      : this.featureFlagService.hasAnyFeature(...requiredFeatures);
  }
}
