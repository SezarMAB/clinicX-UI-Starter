import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, iif, map, merge, of, share, switchMap, tap } from 'rxjs';
import { filterObject, isEmptyObject } from './helpers';
import { User, KeycloakJWTPayload } from './interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { KeycloakAuthService } from './keycloak-auth.service';
import { TenantService } from './tenant.service';
import { JwtToken } from './token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginService = inject(LoginService);
  private readonly tokenService = inject(TokenService);
  private readonly keycloakService = inject(KeycloakAuthService);
  private readonly tenantService = inject(TenantService);

  private user$ = new BehaviorSubject<User>({});
  private change$ = merge(
    this.tokenService.change(),
    this.tokenService.refresh().pipe(switchMap(() => this.refresh()))
  ).pipe(
    switchMap(() => this.assignUser()),
    share()
  );

  init() {
    return new Promise<void>(resolve => this.change$.subscribe(() => resolve()));
  }

  change() {
    return this.change$;
  }

  check() {
    return this.tokenService.valid();
  }

  login(username: string, password: string, rememberMe = false) {
    // Use Keycloak for authentication
    return this.keycloakService.loginWithPassword(username, password).pipe(
      tap(() => {
        // User info is handled by KeycloakAuthService
        const user = this.keycloakService.user();
        if (user) {
          this.user$.next(user);
        }
      }),
      map(() => this.check())
    );
  }

  /**
   * Initiate Keycloak redirect-based login
   */
  async loginWithRedirect(redirectUri?: string) {
    await this.keycloakService.loginWithRedirect(redirectUri);
  }

  refresh() {
    return this.keycloakService.refreshToken().pipe(
      tap(() => {
        // Update user info after refresh
        const user = this.keycloakService.user();
        if (user) {
          this.user$.next(user);
        }
      }),
      catchError(() => of(false)),
      map(() => this.check())
    );
  }

  logout() {
    return of(true).pipe(
      tap(async () => {
        await this.keycloakService.logout();
      }),
      map(() => !this.check())
    );
  }

  user() {
    return this.user$.pipe(share());
  }

  menu() {
    return iif(() => this.check(), this.loginService.menu(), of([]));
  }

  private assignUser() {
    if (!this.check()) {
      return of({}).pipe(tap(user => this.user$.next(user)));
    }

    // Check if we already have user from Keycloak
    const keycloakUser = this.keycloakService.user();
    if (keycloakUser) {
      return of(keycloakUser).pipe(tap(user => this.user$.next(user)));
    }

    if (!isEmptyObject(this.user$.getValue())) {
      return of(this.user$.getValue());
    }

    // Try to get user from token
    const token = this.tokenService.getBearerToken();
    if (token) {
      const accessToken = token.replace('Bearer ', '');
      if (JwtToken.is(accessToken)) {
        const jwtPayload = this.keycloakService.parseJWT(accessToken);
        if (jwtPayload) {
          const user: User = {
            id: jwtPayload.sub,
            name: jwtPayload.name || jwtPayload.preferred_username,
            email: jwtPayload.email,
            preferred_username: jwtPayload.preferred_username,
            tenant_id: jwtPayload.tenant_id,
            clinic_name: jwtPayload.clinic_name,
            clinic_type: jwtPayload.clinic_type,
            roles: jwtPayload.realm_access?.roles || [],
            realm_access: jwtPayload.realm_access,
            resource_access: jwtPayload.resource_access,
          };
          return of(user).pipe(tap(u => this.user$.next(u)));
        }
      }
    }

    // Fallback to login service (for backward compatibility)
    return this.loginService.user().pipe(tap(user => this.user$.next(user)));
  }
}
