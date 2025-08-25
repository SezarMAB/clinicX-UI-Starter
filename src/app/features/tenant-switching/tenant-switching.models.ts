/** Tenant information for switching */
export interface MyTenant {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly subdomain: string;
  readonly isActive: boolean;
  readonly roles?: string[];
}

/** Current tenant information */
export interface CurrentTenant {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly subdomain: string;
  readonly roles?: string[];
}

/** Tenant sync response */
export interface TenantSyncResponse {
  readonly success: boolean;
  readonly message: string;
  readonly syncedTenants?: number;
}

/** Tenant switch response */
export interface TenantSwitchResponse {
  readonly success: boolean;
  readonly message: string;
  readonly newTenantId: string;
}
