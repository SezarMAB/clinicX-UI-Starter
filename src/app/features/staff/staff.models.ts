import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Staff status enum */
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

/** Staff role enum */
export type StaffRole = 'DENTIST' | 'HYGIENIST' | 'ASSISTANT' | 'RECEPTIONIST' | 'ADMIN' | 'OTHER';

/** Staff DTO */
export interface StaffDto {
  readonly id: string; // UUID
  readonly employeeId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: Nullable<string>;
  readonly role: StaffRole;
  readonly specialtyId: Nullable<string>; // UUID
  readonly specialtyName: Nullable<string>;
  readonly status: StaffStatus;
  readonly hireDate: string; // ISO 8601 date
  readonly salary: Nullable<number>;
  readonly workingHours: Nullable<string>;
  readonly notes: Nullable<string>;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Request to create a new staff member */
export interface StaffCreateRequest {
  readonly employeeId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly role: StaffRole;
  readonly specialtyId?: string; // UUID
  readonly hireDate: string; // ISO 8601 date
  readonly salary?: number;
  readonly workingHours?: string;
  readonly notes?: string;
}

/** Request to update an existing staff member */
export interface StaffUpdateRequest {
  readonly employeeId?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly role?: StaffRole;
  readonly specialtyId?: string; // UUID
  readonly salary?: number;
  readonly workingHours?: string;
  readonly notes?: string;
}

/** Staff search criteria */
export interface StaffSearchCriteria {
  readonly searchTerm?: string;
  readonly role?: StaffRole;
  readonly status?: StaffStatus;
  readonly specialtyId?: string; // UUID
  readonly hiredFrom?: string; // ISO 8601 date
  readonly hiredTo?: string; // ISO 8601 date
}

/** Paginated staff response */
export type PageStaffDto = PageResponse<StaffDto>;

/** Staff summary for dropdown/selection */
export interface StaffSummaryDto {
  readonly id: string; // UUID
  readonly employeeId: string;
  readonly fullName: string;
  readonly role: StaffRole;
  readonly specialtyName: Nullable<string>;
  readonly status: StaffStatus;
}
