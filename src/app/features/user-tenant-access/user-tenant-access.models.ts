import { StaffRole } from '../staff/staff.models';

/** User tenant access DTO */
export interface UserTenantAccessDto {
  readonly id?: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly roles: readonly StaffRole[];
  readonly isPrimary: boolean;
  readonly isActive: boolean;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
  readonly createdBy: string; // User ID
  readonly updatedBy: string; // User ID
}

/** Grant tenant access request */
export interface GrantTenantAccessRequest {
  readonly tenantId: string;
  readonly roles: readonly StaffRole[];
  readonly notes?: string;
}
