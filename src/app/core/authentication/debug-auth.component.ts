import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { KeycloakAuthService } from './keycloak-auth.service';

@Component({
  selector: 'app-debug-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; background: #f5f5f5; margin: 20px; border-radius: 8px;">
      <h3>Authentication Debug Info</h3>

      <div style="margin: 10px 0;"><strong>Token Valid:</strong> {{ tokenValid }}</div>

      <div style="margin: 10px 0;">
        <strong>Bearer Token:</strong>
        <pre style="background: white; padding: 10px; overflow: auto;">{{ bearerToken }}</pre>
      </div>

      <div style="margin: 10px 0;">
        <strong>Current User:</strong>
        <pre style="background: white; padding: 10px; overflow: auto;">{{
          currentUser | json
        }}</pre>
      </div>

      <div style="margin: 10px 0;">
        <strong>JWT Payload:</strong>
        <pre style="background: white; padding: 10px; overflow: auto;">{{ jwtPayload | json }}</pre>
      </div>

      <div style="margin: 10px 0;">
        <strong>Accessible Tenants (Raw):</strong>
        <pre style="background: white; padding: 10px; overflow: auto;">{{
          accessibleTenantsRaw
        }}</pre>
      </div>

      <div style="margin: 10px 0;">
        <strong>Accessible Tenants (Parsed):</strong>
        <pre style="background: white; padding: 10px; overflow: auto;">{{
          accessibleTenantsParsed | json
        }}</pre>
      </div>
    </div>
  `,
})
export class DebugAuthComponent implements OnInit {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private keycloakService = inject(KeycloakAuthService);

  tokenValid = false;
  bearerToken = '';
  currentUser: any = null;
  jwtPayload: any = null;
  accessibleTenantsRaw = '';
  accessibleTenantsParsed: any[] = [];

  ngOnInit() {
    this.tokenValid = this.tokenService.valid();
    this.bearerToken = this.tokenService.getBearerToken();

    if (this.bearerToken) {
      const accessToken = this.bearerToken.replace('Bearer ', '');
      this.jwtPayload = this.keycloakService.parseJWT(accessToken);

      if (this.jwtPayload) {
        this.accessibleTenantsRaw = this.jwtPayload.accessible_tenants || 'Not found in JWT';

        // Try to parse accessible tenants
        if (this.jwtPayload.accessible_tenants) {
          try {
            if (typeof this.jwtPayload.accessible_tenants === 'string') {
              const tenantStrings = this.jwtPayload.accessible_tenants.split(',');
              this.accessibleTenantsParsed = tenantStrings.map((tenantStr: string) => {
                const [tenant_id, clinic_name, role] = tenantStr.split('|');
                return { tenant_id, clinic_name, role };
              });
            } else {
              this.accessibleTenantsParsed = this.jwtPayload.accessible_tenants;
            }
          } catch (error) {
            console.error('Failed to parse accessible tenants:', error);
          }
        }
      }
    }

    this.authService.user().subscribe(user => {
      this.currentUser = user;
    });
  }
}
