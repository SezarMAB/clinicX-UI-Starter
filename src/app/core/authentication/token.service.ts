import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, share, timer } from 'rxjs';

import { LocalStorageService } from '@shared';
import { currentTimestamp, filterObject } from './helpers';
import { Token, KeycloakTokenResponse } from './interface';
import { BaseToken } from './token';
import { TokenFactory } from './token-factory.service';

@Injectable({
  providedIn: 'root',
})
export class TokenService implements OnDestroy {
  private readonly baseKey = 'ng-matero-token';
  private readonly baseRefreshKey = 'ng-matero-refresh-token';
  private readonly baseIdTokenKey = 'ng-matero-id-token';

  private readonly store = inject(LocalStorageService);
  private readonly factory = inject(TokenFactory);

  // Get current tenant from subdomain or stored value
  private getCurrentTenantId(): string {
    // Try to get from subdomain first
    const hostname = window.location.hostname;
    if (hostname.endsWith('.localhost')) {
      return hostname.split('.')[0];
    }

    // Try to get from stored tenant key
    const storedTenant = this.store.get('current-tenant-id');
    if (storedTenant && typeof storedTenant === 'string') {
      return storedTenant;
    }

    // Default to 'default' for main domain
    return 'default';
  }

  // Generate tenant-specific keys
  private get key(): string {
    return this.getFormatedKey(this.baseKey);
  }

  private get refreshKey(): string {
    return this.getFormatedKey(this.baseRefreshKey);
  }

  private get idTokenKey(): string {
    return this.getFormatedKey(this.baseIdTokenKey);
  }

  private getFormatedKey(key: string): string {
    const tenantId = this.getCurrentTenantId();
    return `${key}-${tenantId}`;
  }

  private readonly change$ = new BehaviorSubject<BaseToken | undefined>(undefined);
  private readonly refresh$ = new Subject<BaseToken | undefined>();

  private timer$?: Subscription;

  private _token?: BaseToken;

  private get token(): BaseToken | undefined {
    if (!this._token) {
      this._token = this.factory.create(this.store.get(this.key));
    }

    return this._token;
  }

  change() {
    return this.change$.pipe(share());
  }

  refresh() {
    this.buildRefresh();

    return this.refresh$.pipe(share());
  }

  set(token?: Token) {
    this.save(token);

    return this;
  }

  clear() {
    this.save();
    // Also clear refresh and ID tokens
    this.store.remove(this.refreshKey);
    this.store.remove(this.idTokenKey);
    // Clear the current tenant ID
    this.store.remove('current-tenant-id');
  }

  valid() {
    return this.token?.valid() ?? false;
  }

  getBearerToken() {
    return this.token?.getBearerToken() ?? '';
  }

  getRefreshToken() {
    return this.token?.refresh_token || this.store.get(this.refreshKey);
  }

  getIdToken() {
    return this.store.get(this.idTokenKey);
  }

  /**
   * Set tokens from Keycloak response
   */
  setKeycloakTokens(tokenResponse: KeycloakTokenResponse) {
    // Try to extract tenant ID from the access token
    try {
      const parts = tokenResponse.access_token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const tenantId = payload.tenant_id || payload.active_tenant_id;
        if (tenantId) {
          this.store.set('current-tenant-id', tenantId);
        }
      }
    } catch (error) {
      console.error('Failed to extract tenant ID from token:', error);
    }

    // Store refresh and ID tokens separately
    if (tokenResponse.refresh_token) {
      this.store.set(this.refreshKey, tokenResponse.refresh_token);
    }
    if (tokenResponse.id_token) {
      this.store.set(this.idTokenKey, tokenResponse.id_token);
    }

    // Convert Keycloak response to our Token format
    const token: Token = {
      access_token: tokenResponse.access_token,
      token_type: tokenResponse.token_type,
      expires_in: tokenResponse.expires_in,
      refresh_token: tokenResponse.refresh_token,
      scope: tokenResponse.scope,
    };

    this.set(token);
  }

  /**
   * Set the current tenant ID for token storage
   */
  setCurrentTenantId(tenantId: string) {
    this.store.set('current-tenant-id', tenantId);
    // Clear token cache to force reload with new key
    this._token = undefined;
  }

  ngOnDestroy(): void {
    this.clearRefresh();
  }

  private save(token?: Token) {
    this._token = undefined;

    if (!token) {
      this.store.remove(this.key);
    } else {
      const value = Object.assign({ access_token: '', token_type: 'Bearer' }, token, {
        exp: token.expires_in ? currentTimestamp() + token.expires_in : null,
      });
      this.store.set(this.key, filterObject(value));
    }

    this.change$.next(this.token);
    this.buildRefresh();
  }

  private buildRefresh() {
    this.clearRefresh();

    if (this.token?.needRefresh()) {
      this.timer$ = timer(this.token.getRefreshTime() * 1000).subscribe(() => {
        this.refresh$.next(this.token);
      });
    }
  }

  private clearRefresh() {
    if (this.timer$ && !this.timer$.closed) {
      this.timer$.unsubscribe();
    }
  }
}
