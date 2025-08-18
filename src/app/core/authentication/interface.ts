export interface User {
  [prop: string]: any;

  id?: number | string | null;
  name?: string;
  email?: string;
  avatar?: string;

  /**
   * @deprecated Use RoleService.getCurrentTenantRoles() or user_tenant_roles[tenantId] instead.
   * This field now contains tenant-specific roles for the current tenant, not realm roles.
   */
  roles?: any[];

  /**
   * @deprecated Permissions should be derived from roles
   */
  permissions?: any[];

  // Multi-tenant properties from Keycloak
  tenant_id?: string;
  clinic_name?: string;
  clinic_type?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;

  /**
   * @deprecated DO NOT USE for authorization except for GLOBAL_* prefixed roles.
   * Regular realm roles are completely ignored for security.
   * Use user_tenant_roles[tenantId] for tenant-specific authorization.
   */
  realm_access?: {
    roles: string[];
  };

  /**
   * @deprecated DO NOT USE for authorization. Resource/client roles are completely ignored.
   * Use user_tenant_roles[tenantId] for tenant-specific authorization.
   */
  resource_access?: {
    [client: string]: {
      roles: string[];
    };
  };

  // Phase 4 multi-tenant enhancements - THESE ARE THE PRIMARY FIELDS TO USE

  /**
   * The currently active tenant ID for this user session
   */
  active_tenant_id?: string;

  /**
   * List of all tenants this user has access to
   */
  accessible_tenants?: AccessibleTenant[];

  /**
   * CRITICAL: Primary source of authorization - maps tenant IDs to user's roles in each tenant.
   * This is the ONLY field that should be used for role-based authorization.
   * Example: { "tenant-a": ["ADMIN", "DOCTOR"], "tenant-b": ["DOCTOR"] }
   */
  user_tenant_roles?: { [tenantId: string]: string[] };

  /**
   * The specialty/type of the current tenant
   */
  specialty?: TenantSpecialty;
}

export interface Token {
  [prop: string]: any;

  'access_token': string;
  'token_type'?: string;
  'expires_in'?: number;
  'exp'?: number;
  'refresh_token'?: string;
  'id_token'?: string;
  'refresh_expires_in'?: number;
  'not-before-policy'?: number;
  'session_state'?: string;
  'scope'?: string;
}

// Keycloak-specific interfaces
export interface KeycloakTokenResponse {
  'access_token': string;
  'expires_in': number;
  'refresh_expires_in': number;
  'refresh_token': string;
  'token_type': string;
  'id_token'?: string;
  'not-before-policy'?: number;
  'session_state'?: string;
  'scope'?: string;
}

export interface KeycloakJWTPayload {
  exp: number;
  iat: number;
  jti: string;
  iss: string;
  sub: string;
  typ: string;
  azp: string;
  session_state?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  tenant_id?: string;
  clinic_name?: string;
  clinic_type?: string;

  /**
   * @deprecated DO NOT USE for authorization except for GLOBAL_* prefixed roles.
   * Backend completely ignores non-GLOBAL realm roles.
   */
  realm_access?: {
    roles: string[];
  };

  /**
   * @deprecated DO NOT USE. Backend completely ignores resource/client roles.
   */
  resource_access?: {
    [client: string]: {
      roles: string[];
    };
  };

  scope?: string;

  // Phase 4 multi-tenant enhancements - PRIMARY AUTHORIZATION FIELDS

  /**
   * Current active tenant for this session
   */
  active_tenant_id?: string;

  /**
   * List of tenants user can access
   */
  accessible_tenants?: AccessibleTenant[];

  /**
   * CRITICAL: Primary authorization source - tenant-to-roles mapping.
   * Backend ONLY uses this for role-based authorization (plus GLOBAL_* roles).
   * Example: { "tenant-a": ["ADMIN"], "tenant-b": ["DOCTOR"] }
   */
  user_tenant_roles?: { [tenantId: string]: string[] };

  /**
   * Tenant specialty/type
   */
  specialty?: TenantSpecialty;
}

export interface TenantInfo {
  tenant_id: string;
  clinic_name: string;
  clinic_type: string;
  subdomain: string;
}

// Phase 4 multi-tenant interfaces
export interface AccessibleTenant {
  tenant_id: string;
  clinic_name: string;
  clinic_type: string;
  specialty: TenantSpecialty;
  roles: string[];
}

export type TenantSpecialty = 'CLINIC' | 'DENTAL' | 'APPOINTMENTS';

export interface TenantSwitchRequest {
  tenantId: string;
}

export interface TenantSwitchResponse {
  token?: string;
  tenant?: AccessibleTenant;
  success?: boolean;
  message?: string;
}

// API Response for user tenants from backend
export interface UserTenantResponse {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
  specialty?: TenantSpecialty;
}
