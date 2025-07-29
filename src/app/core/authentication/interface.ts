export interface User {
  [prop: string]: any;

  id?: number | string | null;
  name?: string;
  email?: string;
  avatar?: string;
  roles?: any[];
  permissions?: any[];

  // Multi-tenant properties from Keycloak
  tenant_id?: string;
  clinic_name?: string;
  clinic_type?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [client: string]: {
      roles: string[];
    };
  };
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
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [client: string]: {
      roles: string[];
    };
  };
  scope?: string;
}

export interface TenantInfo {
  tenant_id: string;
  clinic_name: string;
  clinic_type: string;
  subdomain: string;
}
