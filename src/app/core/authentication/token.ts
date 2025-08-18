import { base64, capitalize, currentTimestamp, timeLeft } from './helpers';
import { Token } from './interface';

export abstract class BaseToken {
  constructor(protected attributes: Token) {}

  get access_token() {
    return this.attributes.access_token;
  }

  get refresh_token() {
    return this.attributes.refresh_token;
  }

  get token_type() {
    return this.attributes.token_type ?? 'bearer';
  }

  get exp() {
    return this.attributes.exp;
  }

  valid() {
    return this.hasAccessToken() && !this.isExpired();
  }

  getBearerToken() {
    return this.access_token
      ? [capitalize(this.token_type), this.access_token].join(' ').trim()
      : '';
  }

  needRefresh() {
    return this.exp !== undefined && this.exp >= 0;
  }

  getRefreshTime() {
    return timeLeft((this.exp ?? 0) - 5);
  }

  private hasAccessToken() {
    return !!this.access_token;
  }

  private isExpired() {
    return this.exp !== undefined && this.exp - currentTimestamp() <= 0;
  }
}

export class SimpleToken extends BaseToken {}

export class JwtToken extends SimpleToken {
  private _payload?: any;

  static is(accessToken: string): boolean {
    try {
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [_header] = parts;
      const header = JSON.parse(base64.decode(_header));

      return header.typ?.toUpperCase().includes('JWT') || header.typ?.toUpperCase() === 'BEARER';
    } catch (e) {
      return false;
    }
  }

  get exp() {
    return this.payload?.exp;
  }

  get payload(): any {
    if (!this.access_token) {
      return {};
    }

    if (this._payload) {
      return this._payload;
    }

    try {
      const parts = this.access_token.split('.');
      if (parts.length !== 3) {
        return {};
      }

      const [, payload] = parts;
      const data = JSON.parse(base64.decode(payload));
      if (!data.exp) {
        data.exp = this.attributes.exp;
      }

      return (this._payload = data);
    } catch (e) {
      console.error('Failed to parse JWT payload:', e);
      return {};
    }
  }

  // Keycloak-specific getters
  get tenant_id(): string | undefined {
    return this.payload?.tenant_id;
  }

  get clinic_name(): string | undefined {
    return this.payload?.clinic_name;
  }

  get clinic_type(): string | undefined {
    return this.payload?.clinic_type;
  }

  get preferred_username(): string | undefined {
    return this.payload?.preferred_username;
  }

  /**
   * @deprecated Realm roles should NOT be used for authorization except GLOBAL_* roles.
   * Use getTenantRoles() or getGlobalRoles() instead.
   */
  get realm_roles(): string[] {
    console.warn(
      '⚠️ realm_roles is deprecated and should not be used for authorization. Use getTenantRoles() for tenant-specific roles or getGlobalRoles() for global roles.'
    );
    return []; // Return empty array to prevent usage
  }

  /**
   * @deprecated Client/resource roles should NOT be used for authorization.
   * Use getTenantRoles() instead.
   */
  get client_roles(): Record<string, string[]> {
    console.warn(
      '⚠️ client_roles is deprecated and should not be used for authorization. Use getTenantRoles() for tenant-specific roles.'
    );
    return {}; // Return empty object to prevent usage
  }

  // New tenant-aware methods for multi-tenant security

  /**
   * Get user's roles for all tenants
   */
  get user_tenant_roles(): { [tenantId: string]: string[] } {
    return this.payload?.user_tenant_roles || {};
  }

  /**
   * Get the current active tenant ID
   */
  get current_tenant(): string | undefined {
    return (
      this.payload?.current_tenant || this.payload?.active_tenant_id || this.payload?.tenant_id
    );
  }

  /**
   * Get accessible tenants for the user
   */
  get accessible_tenants(): string[] {
    return this.payload?.accessible_tenants || [];
  }

  /**
   * Get roles for a specific tenant (or current tenant if not specified)
   * This is the PRIMARY method for checking user roles
   */
  getTenantRoles(tenantId?: string): string[] {
    const tenant = tenantId || this.current_tenant;
    if (!tenant) {
      console.warn('No tenant context available for role check');
      return [];
    }

    const tenantRoles = this.user_tenant_roles;
    return tenantRoles[tenant] || [];
  }

  /**
   * Get ONLY global roles (those with GLOBAL_ prefix) from realm_access
   * These are the only realm roles that should ever be used
   */
  getGlobalRoles(): string[] {
    const realmRoles = this.payload?.realm_access?.roles || [];
    // CRITICAL: Only return roles that start with GLOBAL_
    // All other realm roles are completely ignored for security
    return realmRoles.filter((role: string) => role && role.startsWith('GLOBAL_'));
  }

  /**
   * Check if user has a specific role in the current tenant
   */
  hasRoleInTenant(role: string, tenantId?: string): boolean {
    const roles = this.getTenantRoles(tenantId);
    return roles.includes(role);
  }

  /**
   * Check if user has a global role
   */
  hasGlobalRole(role: string): boolean {
    const globalRoles = this.getGlobalRoles();
    return globalRoles.includes(role);
  }
}
