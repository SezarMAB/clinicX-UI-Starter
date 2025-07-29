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

  get realm_roles(): string[] {
    return this.payload?.realm_access?.roles || [];
  }

  get client_roles(): Record<string, string[]> {
    return this.payload?.resource_access || {};
  }
}
