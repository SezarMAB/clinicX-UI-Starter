import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FeatureFlagService, FeatureCode } from '@core/services/feature-flag.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '@core/authentication';

/**
 * Structural directive to conditionally display elements based on feature flags
 *
 * Usage:
 * <div *appFeatureFlag="'DENTAL'">This only shows for dental specialty</div>
 * <div *appFeatureFlag="['DENTAL', 'APPOINTMENTS']">This shows for dental or appointments</div>
 */
@Directive({
  selector: '[appFeatureFlag]',
  standalone: true,
})
export class FeatureFlagDirective implements OnInit, OnDestroy {
  private featureFlagService = inject(FeatureFlagService);
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private destroy$ = new Subject<void>();
  private hasView = false;
  private requiredFeatures: FeatureCode[] = [];

  @Input() set appFeatureFlag(features: FeatureCode | FeatureCode[]) {
    this.requiredFeatures = Array.isArray(features) ? features : [features];
    this.updateView();
  }

  @Input() appFeatureFlagRequireAll = false; // If true, all features must be present

  ngOnInit() {
    // Listen for user changes (tenant switching)
    this.authService
      .user()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView() {
    const hasFeature = this.appFeatureFlagRequireAll
      ? this.featureFlagService.hasAllFeatures(...this.requiredFeatures)
      : this.featureFlagService.hasAnyFeature(...this.requiredFeatures);

    if (hasFeature && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasFeature && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
