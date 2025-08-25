import { Nullable } from '../../core/api/api.service';
import { SpecialtyDto } from '../specialties/specialties.models';

/**
 * Staff role enum matching backend exactly
 * Ordered by hierarchy level (highest to lowest authority)
 */
export enum StaffRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  ASSISTANT = 'ASSISTANT',
  RECEPTIONIST = 'RECEPTIONIST',
  ACCOUNTANT = 'ACCOUNTANT',
  EXTERNAL = 'EXTERNAL',
  INTERNAL = 'INTERNAL',
}

/** Role hierarchy levels matching backend implementation */
export const STAFF_ROLE_HIERARCHY: Record<StaffRole, number> = {
  [StaffRole.SUPER_ADMIN]: 100,
  [StaffRole.ADMIN]: 90,
  [StaffRole.DOCTOR]: 80,
  [StaffRole.NURSE]: 70,
  [StaffRole.ASSISTANT]: 60,
  [StaffRole.RECEPTIONIST]: 50,
  [StaffRole.ACCOUNTANT]: 40,
  [StaffRole.EXTERNAL]: 20,
  [StaffRole.INTERNAL]: 10,
};

/** Display names for roles matching backend implementation */
export const STAFF_ROLE_DISPLAY_NAMES: Record<StaffRole, string> = {
  [StaffRole.SUPER_ADMIN]: 'Super Administrator',
  [StaffRole.ADMIN]: 'Administrator',
  [StaffRole.DOCTOR]: 'Doctor',
  [StaffRole.NURSE]: 'Nurse',
  [StaffRole.ASSISTANT]: 'Medical Assistant',
  [StaffRole.RECEPTIONIST]: 'Receptionist',
  [StaffRole.ACCOUNTANT]: 'Accountant',
  [StaffRole.EXTERNAL]: 'External Staff',
  [StaffRole.INTERNAL]: 'Internal Staff',
};

/** Utility functions for StaffRole management */
export class StaffRoleUtils {
  /**
   * Checks if a role has higher or equal authority compared to another role
   */
  static hasAuthorityOver(role: StaffRole, other: StaffRole): boolean {
    return STAFF_ROLE_HIERARCHY[role] >= STAFF_ROLE_HIERARCHY[other];
  }

  /**
   * Checks if a role is administrative (ADMIN or SUPER_ADMIN)
   */
  static isAdministrative(role: StaffRole): boolean {
    return role === StaffRole.ADMIN || role === StaffRole.SUPER_ADMIN;
  }

  /**
   * Checks if a role is clinical (DOCTOR, NURSE, or ASSISTANT)
   */
  static isClinical(role: StaffRole): boolean {
    return role === StaffRole.DOCTOR || role === StaffRole.NURSE || role === StaffRole.ASSISTANT;
  }

  /**
   * Gets the display name for a role
   */
  static getDisplayName(role: StaffRole): string {
    return STAFF_ROLE_DISPLAY_NAMES[role];
  }

  /**
   * Gets hierarchy level for a role
   */
  static getHierarchyLevel(role: StaffRole): number {
    return STAFF_ROLE_HIERARCHY[role];
  }

  /**
   * Converts string to StaffRole enum value with validation
   */
  static fromString(roleString: string): StaffRole | null {
    const upperRole = roleString?.trim().toUpperCase();
    if (Object.values(StaffRole).includes(upperRole as StaffRole)) {
      return upperRole as StaffRole;
    }
    // Try display name matching
    const matchingRole = Object.entries(STAFF_ROLE_DISPLAY_NAMES).find(
      ([_, displayName]) => displayName.toLowerCase() === roleString?.toLowerCase()
    );
    return matchingRole ? (matchingRole[0] as StaffRole) : null;
  }

  /**
   * Removes duplicate roles from array (Set-like behavior)
   */
  static deduplicate(roles: StaffRole[]): StaffRole[] {
    return Array.from(new Set(roles));
  }

  /**
   * Sorts roles by hierarchy level (highest authority first)
   */
  static sortByHierarchy(roles: StaffRole[]): StaffRole[] {
    return [...roles].sort((a, b) => STAFF_ROLE_HIERARCHY[b] - STAFF_ROLE_HIERARCHY[a]);
  }

  /**
   * Gets all available roles as array
   */
  static getAllRoles(): StaffRole[] {
    return Object.values(StaffRole);
  }

  /**
   * Validates if roles array is valid (no nulls, no duplicates)
   */
  static validateRoles(roles: StaffRole[]): boolean {
    if (!roles || roles.length === 0) return false;
    const uniqueRoles = this.deduplicate(roles);
    return uniqueRoles.length === roles.length && roles.every(role => role in StaffRole);
  }
}

/** Staff DTO */
export interface StaffDto {
  readonly id: string; // UUID
  readonly fullName: string;
  readonly role: StaffRole;
  readonly email: string;
  readonly phoneNumber: Nullable<string>;
  readonly isActive: boolean;
  readonly specialties: readonly SpecialtyDto[];
  readonly keycloakUserId: Nullable<string>;
  readonly tenantId: Nullable<string>;
  readonly accessRoles: Nullable<readonly StaffRole[]>;
  readonly isPrimary: Nullable<boolean>;
  readonly accessActive: Nullable<boolean>;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Request to create a new staff member */
export interface StaffCreateRequest {
  readonly fullName: string;
  readonly role: StaffRole;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly specialtyIds?: readonly string[]; // UUID array
  readonly createKeycloakUser?: boolean;
  readonly password?: string;
  readonly username?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly keycloakUserId?: string;
  readonly accessRoles?: readonly StaffRole[];
  readonly isPrimaryTenant?: boolean;
}

/** Request to update an existing staff member */
export interface StaffUpdateRequest {
  readonly fullName: string;
  readonly role: StaffRole;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly isActive: boolean;
  readonly specialtyIds?: readonly string[]; // UUID array
}

/** Staff search criteria */
export interface StaffSearchCriteria {
  readonly searchTerm?: string;
  readonly role?: StaffRole;
  readonly specialtyIds?: readonly string[]; // UUID array
  readonly isActive?: boolean;
}

/** Spring Data Page response */
export interface Page<T> {
  readonly content: readonly T[];
  readonly number: number; // current page (0-based)
  readonly size: number; // items per page
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly sort: {
    readonly empty: boolean;
    readonly sorted: boolean;
    readonly unsorted: boolean;
  };
  readonly numberOfElements: number;
  readonly empty: boolean;
}

/** Pageable options for requests */
export interface PageableOptions {
  readonly page: number; // 0-based
  readonly size: number;
  readonly sort?: string | readonly string[]; // e.g., 'fullName,asc' or ['fullName,asc', 'email,desc']
}
