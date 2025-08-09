/** User tenant access DTO */
export interface UserTenantAccessDto {
  readonly userId: string;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly roles: string[];
  readonly grantedAt: string; // ISO 8601 date-time
  readonly grantedBy: string; // User ID
  readonly isActive: boolean;
}

/** Grant tenant access request */
export interface GrantTenantAccessRequest {
  readonly tenantId: string;
  readonly roles: string[];
  readonly notes?: string;
}
