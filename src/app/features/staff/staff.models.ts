import { Nullable } from '../../core/api/api.service';
import { SpecialtyDto } from '../specialties/specialties.models';

/** Staff role enum matching backend exactly */
export enum StaffRole {
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  ASSISTANT = 'ASSISTANT',
  RECEPTIONIST = 'RECEPTIONIST',
  ACCOUNTANT = 'ACCOUNTANT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
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
  readonly accessRole: Nullable<string>;
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
  readonly accessRole?: string;
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
