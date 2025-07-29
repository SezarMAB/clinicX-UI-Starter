import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { base64 } from './helpers';
import { TokenService } from './token.service';
import { TenantInfo } from './interface';

export interface JwtPayload {
  tenant_id?: string;
  clinic_name?: string;
  clinic_type?: string;
  [key: string]: any;
}

/**
 * Service for managing tenant information in the ClickX medical application.
 * Handles tenant context from subdomains and JWT tokens.
 */
@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private readonly document = inject(DOCUMENT);
  private readonly tokenService = inject(TokenService);

  // Signals for reactive state management
  private readonly tenantInfo = signal<TenantInfo | null>(null);
  private readonly isInitialized = signal(false);
  private readonly error = signal<string | null>(null);

  // Computed signals for easy access
  readonly currentTenant = this.tenantInfo.asReadonly();
  readonly tenantId = computed(() => this.tenantInfo()?.tenant_id || null);
  readonly clinicName = computed(() => this.tenantInfo()?.clinic_name || null);
  readonly clinicType = computed(() => this.tenantInfo()?.clinic_type || null);
  readonly subdomain = computed(() => this.tenantInfo()?.subdomain || null);
  readonly hasValidTenant = computed(() => !!this.tenantInfo()?.tenant_id);
  readonly initialized = this.isInitialized.asReadonly();
  readonly tenantError = this.error.asReadonly();

  constructor() {
    // Initialize tenant context on service creation
    this.initializeTenantContext();

    // React to token changes
    effect(() => {
      // This effect will re-run whenever the token changes
      this.tokenService.change().subscribe(() => {
        this.updateTenantFromToken();
      });
    });
  }

  /**
   * Initialize tenant context from subdomain and token
   */
  private initializeTenantContext(): void {
    try {
      // First, try to extract from subdomain
      const subdomainInfo = this.extractFromSubdomain();
      if (subdomainInfo) {
        this.tenantInfo.set(subdomainInfo);
      }

      // Then, try to extract from token (will override subdomain if present)
      this.updateTenantFromToken();

      this.isInitialized.set(true);
    } catch (error) {
      this.handleError('Failed to initialize tenant context', error);
    }
  }

  /**
   * Extract tenant information from the subdomain
   * Expected format: tenant-id.clickx.com
   */
  private extractFromSubdomain(): TenantInfo | null {
    try {
      const hostname = this.document.location.hostname;

      // Check if we're on a subdomain
      const parts = hostname.split('.');
      if (parts.length < 3) {
        // Not a subdomain (e.g., localhost or clickx.com)
        return null;
      }

      const subdomain = parts[0];

      // Skip common non-tenant subdomains
      const skipSubdomains = ['www', 'app', 'api', 'admin', 'localhost'];
      if (skipSubdomains.includes(subdomain.toLowerCase())) {
        return null;
      }

      // For now, return basic info from subdomain
      // In production, you might want to fetch full details from an API
      return {
        tenant_id: subdomain,
        clinic_name: this.formatClinicName(subdomain),
        clinic_type: 'general', // Default, should be fetched from API
        subdomain,
      };
    } catch (error) {
      this.handleError('Failed to extract tenant from subdomain', error);
      return null;
    }
  }

  /**
   * Update tenant information from JWT token
   */
  private updateTenantFromToken(): void {
    try {
      const token = this.tokenService.getBearerToken();
      if (!token) {
        return;
      }

      // Extract the JWT part (remove "Bearer " prefix)
      const jwt = token.replace(/^Bearer\s+/i, '');
      const payload = this.parseJwtPayload(jwt);

      if (payload && (payload.tenant_id || payload.clinic_name)) {
        const currentInfo = this.tenantInfo();
        this.tenantInfo.set({
          tenant_id: payload.tenant_id || currentInfo?.tenant_id || '',
          clinic_name: payload.clinic_name || currentInfo?.clinic_name || '',
          clinic_type: payload.clinic_type || currentInfo?.clinic_type || 'general',
          subdomain: currentInfo?.subdomain || payload.tenant_id || '',
        });
      }
    } catch (error) {
      this.handleError('Failed to update tenant from token', error);
    }
  }

  /**
   * Parse JWT payload to extract tenant information
   */
  private parseJwtPayload(jwt: string): JwtPayload | null {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = base64.decode(payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
      this.handleError('Failed to parse JWT payload', error);
      return null;
    }
  }

  /**
   * Format clinic name from subdomain
   * e.g., "dental-care-center" -> "Dental Care Center"
   */
  private formatClinicName(subdomain: string): string {
    return subdomain
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Manually set tenant information
   * Useful for testing or when tenant info comes from other sources
   */
  setTenant(tenantInfo: TenantInfo): void {
    this.tenantInfo.set(tenantInfo);
    this.error.set(null);
  }

  /**
   * Clear tenant information
   */
  clearTenant(): void {
    this.tenantInfo.set(null);
    this.error.set(null);
  }

  /**
   * Get tenant-specific API base URL
   * Can be used to construct tenant-specific endpoints
   */
  getTenantApiUrl(path: string): string {
    const tenant = this.tenantInfo();
    if (!tenant) {
      return path;
    }

    // If the path already includes tenant info, return as is
    if (path.includes('/tenants/') || path.includes(`/${tenant.tenant_id}/`)) {
      return path;
    }

    // Prepend tenant ID to the path
    return `/tenants/${tenant.tenant_id}${path}`;
  }

  /**
   * Check if the current user has access to a specific tenant
   * This is a basic check - implement more sophisticated logic as needed
   */
  hasAccessToTenant(tenantId: string): boolean {
    const currentTenantId = this.tenantId();
    return currentTenantId === tenantId;
  }

  /**
   * Handle errors and update error signal
   */
  private handleError(message: string, error: any): void {
    console.error(`[TenantService] ${message}:`, error);
    this.error.set(message);
  }

  /**
   * Get a string representation of the current tenant for debugging
   */
  toString(): string {
    const tenant = this.tenantInfo();
    if (!tenant) {
      return 'No tenant context';
    }
    return `Tenant: ${tenant.clinic_name} (ID: ${tenant.tenant_id}, Type: ${tenant.clinic_type})`;
  }
}
