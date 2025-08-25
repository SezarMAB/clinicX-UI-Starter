import { Nullable } from '../../core/api/api.service';

/** Generic medical record data */
export interface MedicalRecord {
  readonly [key: string]: unknown;
}

/** Generic response from secured endpoints */
export interface SecuredResponse {
  readonly [key: string]: string;
}

/** Tenant settings DTO */
export interface TenantSettings {
  readonly [key: string]: unknown;
}

/** Current tenant information */
export interface TenantInfo {
  readonly [key: string]: unknown;
}

/** System audit information */
export interface SystemAudit {
  readonly [key: string]: unknown;
}

/** Tenant summary for multi-tenant access */
export interface MyTenant {
  readonly [key: string]: unknown;
}

/** Appointment data from secured endpoint */
export interface SecuredAppointment {
  readonly [key: string]: unknown;
}

/** Tenant user information for admin endpoints */
export interface SecuredTenantUser {
  readonly [key: string]: unknown;
}

/** Dynamic action request */
export interface DynamicActionRequest {
  readonly [key: string]: unknown;
}
