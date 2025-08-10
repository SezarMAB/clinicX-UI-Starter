import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/**
 * Specialty type for tenants
 */
export type TenantSpecialty = 'CLINIC' | 'DENTAL' | 'APPOINTMENTS' | 'CHRORG';

/**
 * Subscription plan types
 */
export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

/**
 * Detailed DTO for individual tenant views
 */
export interface TenantDetailDto {
  readonly id: string; // UUID
  readonly tenantId: string;
  readonly name: string;
  readonly subdomain: string;
  readonly realmName: string;
  readonly specialty: TenantSpecialty;
  readonly isActive: boolean;
  readonly contactEmail: string;
  readonly contactPhone: Nullable<string>;
  readonly address: Nullable<string>;
  readonly subscriptionStartDate: string; // ISO 8601 date-time
  readonly subscriptionEndDate: Nullable<string>; // ISO 8601 date-time
  readonly subscriptionPlan: SubscriptionPlan;
  readonly maxUsers: number;
  readonly maxPatients: number;
  readonly currentUsers: number;
  readonly currentPatients: number;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
  readonly createdBy: string;
  readonly updatedBy: string;
}

/**
 * Summary DTO for tenant listing views
 */
export interface TenantSummaryDto {
  readonly id: string; // UUID
  readonly tenantId: string;
  readonly name: string;
  readonly subdomain: string;
  readonly isActive: boolean;
  readonly contactEmail: string;
  readonly subscriptionPlan: SubscriptionPlan;
  readonly subscriptionEndDate: Nullable<string>; // ISO 8601 date-time
  readonly currentUsers: number;
  readonly currentPatients: number;
  readonly hasAlert: boolean;
}

/**
 * Request to create a new tenant
 */
export interface TenantCreateRequest {
  readonly name: string; // min: 3, max: 100 characters
  readonly subdomain: string; // Pattern: ^[a-z0-9]+(-[a-z0-9]+)*$, min: 3, max: 50
  readonly contactEmail: string; // Valid email format
  readonly contactPhone?: string; // Pattern: ^\\+?[0-9\\-\\s]+$
  readonly address?: string;
  readonly subscriptionPlan: SubscriptionPlan;
  readonly maxUsers?: number; // Default: 10
  readonly maxPatients?: number; // Default: 1000
  readonly adminUsername: string; // min: 3, max: 50 characters
  readonly adminEmail: string; // Valid email format
  readonly adminFirstName: string;
  readonly adminLastName: string;
  readonly adminPassword: string; // min: 8 characters
  readonly specialty: TenantSpecialty; // Default: 'CLINIC'
}

/**
 * Request to update a tenant
 */
export interface TenantUpdateRequest {
  readonly name?: string; // min: 3, max: 100 characters
  readonly contactEmail?: string; // Must be valid email format
  readonly contactPhone?: string; // Pattern: ^\\+?[0-9\\-\\s]+$
  readonly address?: string;
  readonly subscriptionPlan?: string;
  readonly subscriptionEndDate?: string; // ISO 8601 date-time
  readonly maxUsers?: number;
  readonly maxPatients?: number;
}

/**
 * Response DTO for tenant creation containing essential configuration details
 */
export interface TenantCreationResponseDto {
  readonly id: string; // UUID
  readonly tenantId: string;
  readonly name: string;
  readonly subdomain: string;
  readonly realmName: string;
  readonly backendClientId: string;
  readonly backendClientSecret: string;
  readonly frontendClientId: string;
  readonly keycloakUrl: string;
  readonly adminUsername: string;
}

/**
 * DTO for subdomain availability check response
 */
export interface SubdomainAvailabilityDto {
  readonly subdomain: string;
  readonly available: boolean;
  readonly message: string;
}

/**
 * Paginated tenant response
 */
export type PageTenantSummaryDto = PageResponse<TenantSummaryDto>;

/**
 * Tenant search criteria for filtering
 */
export interface TenantSearchCriteria {
  readonly searchTerm?: string;
  readonly isActive?: boolean;
}
