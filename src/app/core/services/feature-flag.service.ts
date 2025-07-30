import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/authentication';
import { TenantSpecialty } from '@core/authentication/interface';

export type FeatureCode =
  | 'ALL'
  | 'DENTAL'
  | 'APPOINTMENTS'
  | 'PATIENTS'
  | 'TREATMENTS'
  | 'INVOICES'
  | 'INVENTORY'
  | 'REPORTS'
  | 'LAB_REQUESTS'
  | 'DENTAL_CHARTS'
  | 'DENTAL_PROCEDURES'
  | 'APPOINTMENT_CALENDAR'
  | 'APPOINTMENT_REMINDERS'
  | 'FINANCIAL_REPORTS'
  | 'CLINICAL_NOTES';

interface SpecialtyFeatures {
  [key: string]: FeatureCode[];
}

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private authService = inject(AuthService);

  // Convert user observable to signal
  private currentUser = toSignal(this.authService.user());

  // Computed values
  currentTenantSpecialty = computed(() => {
    const user = this.currentUser();
    if (!user) return null;

    // Try to get specialty from current tenant
    const currentTenant = user.accessible_tenants?.find(t => t.tenant_id === user.active_tenant_id);
    if (currentTenant) return currentTenant.specialty;

    // Fallback to user specialty
    return user.specialty || null;
  });

  // Define feature mappings for each specialty
  private specialtyFeatures: SpecialtyFeatures = {
    CLINIC: [
      'ALL', // Clinic type has access to all features
    ],
    DENTAL: [
      'PATIENTS',
      'TREATMENTS',
      'INVOICES',
      'APPOINTMENTS',
      'REPORTS',
      'LAB_REQUESTS',
      'DENTAL_CHARTS',
      'DENTAL_PROCEDURES',
      'APPOINTMENT_CALENDAR',
      'APPOINTMENT_REMINDERS',
      'FINANCIAL_REPORTS',
      'CLINICAL_NOTES',
    ],
    APPOINTMENTS: [
      'PATIENTS',
      'APPOINTMENTS',
      'APPOINTMENT_CALENDAR',
      'APPOINTMENT_REMINDERS',
      'REPORTS',
    ],
  };

  /**
   * Check if a feature is available for the current tenant's specialty
   */
  hasFeature(featureCode: FeatureCode): boolean {
    const specialty = this.currentTenantSpecialty();
    if (!specialty) return false;

    const features = this.specialtyFeatures[specialty] || [];
    return features.includes('ALL') || features.includes(featureCode);
  }

  /**
   * Get all available features for the current tenant's specialty
   */
  getAvailableFeatures(): FeatureCode[] {
    const specialty = this.currentTenantSpecialty();
    if (!specialty) return [];

    const features = this.specialtyFeatures[specialty] || [];
    if (features.includes('ALL')) {
      // Return all possible features
      return [
        'PATIENTS',
        'TREATMENTS',
        'INVOICES',
        'INVENTORY',
        'APPOINTMENTS',
        'REPORTS',
        'LAB_REQUESTS',
        'DENTAL_CHARTS',
        'DENTAL_PROCEDURES',
        'APPOINTMENT_CALENDAR',
        'APPOINTMENT_REMINDERS',
        'FINANCIAL_REPORTS',
        'CLINICAL_NOTES',
      ];
    }

    return features.filter(f => f !== 'ALL');
  }

  /**
   * Check if the current tenant is of a specific specialty
   */
  isSpecialty(specialty: TenantSpecialty): boolean {
    return this.currentTenantSpecialty() === specialty;
  }

  /**
   * Get specialty-specific configuration
   */
  getSpecialtyConfig(specialty?: TenantSpecialty) {
    const targetSpecialty = specialty || this.currentTenantSpecialty();

    switch (targetSpecialty) {
      case 'DENTAL':
        return {
          primaryColor: '#388e3c',
          accentColor: '#66bb6a',
          icon: 'medical_services',
          displayName: 'Dental Clinic',
          features: this.specialtyFeatures.DENTAL,
        };
      case 'APPOINTMENTS':
        return {
          primaryColor: '#f57c00',
          accentColor: '#ffb74d',
          icon: 'event',
          displayName: 'Appointment Center',
          features: this.specialtyFeatures.APPOINTMENTS,
        };
      case 'CLINIC':
      default:
        return {
          primaryColor: '#1976d2',
          accentColor: '#42a5f5',
          icon: 'local_hospital',
          displayName: 'Medical Clinic',
          features: this.specialtyFeatures.CLINIC,
        };
    }
  }

  /**
   * Check multiple features at once
   */
  hasAnyFeature(...features: FeatureCode[]): boolean {
    return features.some(feature => this.hasFeature(feature));
  }

  /**
   * Check if all features are available
   */
  hasAllFeatures(...features: FeatureCode[]): boolean {
    return features.every(feature => this.hasFeature(feature));
  }
}
