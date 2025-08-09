import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Tenant access information */
export interface TenantAccessInfo {
  readonly tenantId?: string;
  readonly tenantName?: string;
  readonly clinicType?: string;
  readonly roles?: readonly string[];
  readonly isPrimary?: boolean;
}

/** Tenant user DTO */
export interface TenantUserDto {
  readonly userId?: string;
  readonly username?: string;
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly enabled?: boolean;
  readonly emailVerified?: boolean;
  readonly roles?: readonly string[];
  readonly primaryTenantId?: string;
  readonly activeTenantId?: string;
  readonly isExternal?: boolean;
  readonly accessibleTenants?: readonly TenantAccessInfo[];
  readonly attributes?: Record<string, unknown>;
  readonly createdAt?: string; // ISO 8601 date-time
  readonly lastLogin?: string; // ISO 8601 date-time
  readonly userType?: string;
}

/** Request to create a new tenant user */
export interface TenantUserCreateRequest {
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly password: string;
  readonly roles: readonly string[];
  readonly phoneNumber?: string;
  readonly temporaryPassword?: boolean;
  readonly sendWelcomeEmail?: boolean;
  readonly additionalAttributes?: Record<string, unknown>;
}

/** Request to update an existing tenant user */
export interface TenantUserUpdateRequest {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phoneNumber?: string;
  readonly enabled?: boolean;
  readonly attributes?: Record<string, unknown>;
}

/** Request to update user roles */
export interface UpdateUserRolesRequest {
  readonly roles: readonly string[];
}

/** Request to reset user password */
export interface ResetPasswordRequest {
  readonly newPassword: string;
  readonly temporary?: boolean;
}

/** Request to grant external user access */
export interface GrantExternalAccessRequest {
  readonly username: string;
  readonly roles: readonly string[];
  readonly accessNote?: string;
}

/** User activity DTO */
export interface UserActivityDto {
  readonly activityId?: string;
  readonly userId?: string;
  readonly username?: string;
  readonly activityType?: string;
  readonly description?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly timestamp?: string; // ISO 8601 date-time
  readonly tenantId?: string;
  readonly details?: Record<string, unknown>;
  readonly success?: boolean;
}

/** Sort object for pagination */
export interface SortObject {
  readonly empty?: boolean;
  readonly unsorted?: boolean;
  readonly sorted?: boolean;
}

/** Swagger pageable object */
export interface SwaggerPageable {
  readonly page?: number;
  readonly size?: number;
  readonly sort?: string;
}

/** Paginated tenant user response */
export interface PageTenantUserDto {
  readonly totalElements?: number;
  readonly totalPages?: number;
  readonly first?: boolean;
  readonly last?: boolean;
  readonly size?: number;
  readonly content?: readonly TenantUserDto[];
  readonly number?: number;
  readonly sort?: SortObject;
  readonly numberOfElements?: number;
  readonly pageable?: SwaggerPageable;
  readonly empty?: boolean;
}

/** Paginated user activity response */
export interface PageUserActivityDto {
  readonly totalElements?: number;
  readonly totalPages?: number;
  readonly first?: boolean;
  readonly last?: boolean;
  readonly size?: number;
  readonly content?: readonly UserActivityDto[];
  readonly number?: number;
  readonly sort?: SortObject;
  readonly numberOfElements?: number;
  readonly pageable?: SwaggerPageable;
  readonly empty?: boolean;
}
