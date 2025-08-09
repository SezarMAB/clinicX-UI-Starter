import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Tenant status enum */
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

/** Tenant detail DTO */
export interface TenantDetailDto {
  readonly id: string; // UUID
  readonly name: string;
  readonly displayName: string;
  readonly domain: Nullable<string>;
  readonly status: TenantStatus;
  readonly description: Nullable<string>;
  readonly contactEmail: string;
  readonly contactPhone: Nullable<string>;
  readonly address: Nullable<string>;
  readonly maxUsers: number;
  readonly currentUsers: number;
  readonly subscriptionPlan: string;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
  readonly expirationDate: Nullable<string>; // ISO 8601 date-time
}

/** Tenant summary DTO */
export interface TenantSummaryDto {
  readonly id: string; // UUID
  readonly name: string;
  readonly displayName: string;
  readonly status: TenantStatus;
  readonly currentUsers: number;
  readonly maxUsers: number;
  readonly subscriptionPlan: string;
  readonly createdAt: string; // ISO 8601 date-time
}

/** Request to create a new tenant */
export interface TenantCreateRequest {
  readonly name: string;
  readonly displayName: string;
  readonly domain?: string;
  readonly description?: string;
  readonly contactEmail: string;
  readonly contactPhone?: string;
  readonly address?: string;
  readonly maxUsers: number;
  readonly subscriptionPlan: string;
  readonly adminUser: TenantAdminUserRequest;
}

/** Admin user for tenant creation */
export interface TenantAdminUserRequest {
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly temporaryPassword?: boolean;
}

/** Request to update a tenant */
export interface TenantUpdateRequest {
  readonly displayName?: string;
  readonly domain?: string;
  readonly description?: string;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly address?: string;
  readonly maxUsers?: number;
  readonly subscriptionPlan?: string;
}

/** Tenant creation response */
export interface TenantCreationResponseDto {
  readonly tenant: TenantDetailDto;
  readonly adminUser: {
    readonly userId: string;
    readonly username: string;
    readonly email: string;
    readonly temporaryPassword?: string;
  };
  readonly keycloakRealm: string;
}

/** Paginated tenant response */
export type PageTenantSummaryDto = PageResponse<TenantSummaryDto>;

/** Tenant search criteria */
export interface TenantSearchCriteria {
  readonly searchTerm?: string;
  readonly status?: TenantStatus;
  readonly subscriptionPlan?: string;
  readonly createdFrom?: string; // ISO 8601 date
  readonly createdTo?: string; // ISO 8601 date
}
