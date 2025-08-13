import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';
import { StaffRole } from '@features/staff';

/** User type enumeration */
export enum UserType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

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
  readonly attributes?: Record<string, readonly string[]>;
  readonly createdAt?: string; // ISO 8601 date-time
  readonly lastLogin?: string; // ISO 8601 date-time
  readonly userType?: UserType | StaffRole;
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
  readonly additionalAttributes?: Record<string, string>;
}

/** Request to update an existing tenant user */
export interface TenantUserUpdateRequest {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phoneNumber?: string;
  readonly enabled?: boolean;
  readonly attributes?: Record<string, string>;
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

/** Activity type enumeration */
export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  TENANT_SWITCH = 'TENANT_SWITCH',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_REVOKED = 'ACCESS_REVOKED',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  EXPORT_DATA = 'EXPORT_DATA',
  API_ACCESS = 'API_ACCESS',
}

/** User activity DTO */
export interface UserActivityDto {
  readonly activityId?: string;
  readonly userId?: string;
  readonly username?: string;
  readonly activityType?: ActivityType;
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
