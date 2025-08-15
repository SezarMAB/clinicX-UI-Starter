import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';
import { StaffRole, StaffRoleUtils } from '@features/staff';

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
  readonly roles?: readonly StaffRole[];
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
  readonly roles?: readonly StaffRole[];
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
  readonly roles: readonly StaffRole[];
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

/**
 * Request to update user roles.
 * Note: Backend expects Set<StaffRole>, so ensure no duplicates in the roles array.
 * Use StaffRoleUtils.deduplicate() to ensure unique roles.
 */
export interface UpdateUserRolesRequest {
  readonly roles: readonly StaffRole[];
}

/** Request to reset user password */
export interface ResetPasswordRequest {
  readonly newPassword: string;
  readonly temporary?: boolean;
}

/** Request to grant external user access */
export interface GrantExternalAccessRequest {
  readonly username: string;
  readonly roles: readonly StaffRole[];
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

/** Utility functions for tenant user management */
export class TenantUserUtils {
  /**
   * Creates a valid UpdateUserRolesRequest ensuring no duplicate roles
   */
  static createUpdateRolesRequest(roles: StaffRole[]): UpdateUserRolesRequest {
    return {
      roles: StaffRoleUtils.deduplicate(roles),
    };
  }

  /**
   * Validates if a user can be assigned certain roles based on current user's authority
   */
  static canAssignRoles(
    currentUserRoles: readonly StaffRole[],
    rolesToAssign: readonly StaffRole[]
  ): boolean {
    if (!currentUserRoles?.length || !rolesToAssign?.length) {
      return false;
    }

    const highestCurrentRole = StaffRoleUtils.sortByHierarchy([...currentUserRoles])[0];

    return rolesToAssign.every(roleToAssign =>
      StaffRoleUtils.hasAuthorityOver(highestCurrentRole, roleToAssign)
    );
  }

  /**
   * Gets the display names for user roles
   */
  static getUserRoleDisplayNames(roles: readonly StaffRole[]): string[] {
    return roles?.map(role => StaffRoleUtils.getDisplayName(role)) || [];
  }

  /**
   * Gets the highest authority role from user's roles
   */
  static getHighestRole(roles: readonly StaffRole[]): StaffRole | null {
    if (!roles?.length) return null;
    return StaffRoleUtils.sortByHierarchy([...roles])[0];
  }

  /**
   * Checks if user has administrative privileges
   */
  static isUserAdmin(user: TenantUserDto): boolean {
    return user.roles?.some(role => StaffRoleUtils.isAdministrative(role)) || false;
  }

  /**
   * Checks if user has clinical roles
   */
  static isUserClinical(user: TenantUserDto): boolean {
    return user.roles?.some(role => StaffRoleUtils.isClinical(role)) || false;
  }

  /**
   * Formats user display name with role information
   */
  static formatUserDisplayName(user: TenantUserDto): string {
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Unknown User';
    const highestRole = this.getHighestRole(user.roles || []);
    if (highestRole) {
      return `${name} (${StaffRoleUtils.getDisplayName(highestRole)})`;
    }
    return name;
  }
}
