import { Injectable, inject } from '@angular/core';
import { AuthService, User, TenantService } from '@core/authentication';
import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { switchMap, tap } from 'rxjs';
import { Menu, MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class StartupService {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);
  private readonly permissionsService = inject(NgxPermissionsService);
  private readonly rolesService = inject(NgxRolesService);
  private readonly tenantService = inject(TenantService);

  /**
   * Role → permissions mapping
   * Add / change permissions by editing the literals below.
   */
  private static readonly ROLE_PERMS: Record<string, string[]> = {
    SUPER_ADMIN: [
      'canAdd',
      'canDelete',
      'canEdit',
      'canRead',
      'canManageUsers',
      'canManageSettings',
      'canViewReports',
    ],
    ADMIN: ['canAdd', 'canDelete', 'canEdit', 'canRead', 'canManageUsers', 'canViewReports'],
    DOCTOR: ['canRead', 'canEdit', 'canAdd', 'canViewPatientRecords', 'canPrescribe'],
    NURSE: ['canRead', 'canEdit', 'canViewPatientRecords', 'canUpdateVitals'],
    ASSISTANT: ['canRead', 'canEdit', 'canScheduleAppointments'],
    RECEPTIONIST: [
      'canRead',
      'canAdd',
      'canEdit',
      'canScheduleAppointments',
      'canRegisterPatients',
    ],
    ACCOUNTANT: ['canRead', 'canViewReports', 'canManageBilling', 'canGenerateInvoices'],
    MANAGER: ['canRead', 'canEdit', 'canAdd', 'canViewReports', 'canManageTeam'],
    GUEST: ['canRead'],
  };

  /**
   * Boot-strap the app after we retrieved menu, roles and permissions.
   */
  load(): Promise<void> {
    return new Promise<void>(resolve => {
      this.authService
        .change()
        .pipe(
          tap(user => {
            if (user) {
              this.setPermissions(user);

              // ── Tenant information (debug) ──────────────────────────────
              const u = user as User & { tenant_id?: string };
              if (u.tenant_id) {
                console.log('Tenant initialised:', {
                  tenant_id: u.tenant_id,
                  clinic_name: u.clinic_name,
                  clinic_type: u.clinic_type,
                  subdomain: this.tenantService.subdomain(),
                });
              }
            }
          }),
          switchMap(() => this.authService.menu()),
          tap(menu => this.setMenu(menu))
        )
        .subscribe({
          next: () => resolve(),
          error: () => resolve(), // fail-open so the app still starts
        });
    });
  }

  /* ───────────────────────────────────────────────────────────────────── */

  private setMenu(menu: Menu[]): void {
    this.menuService.addNamespace(menu, 'menu');
    this.menuService.set(menu);
  }

  /**
   * Extract roles & permissions from the Keycloak token and
   * load them into ngx-permissions / ngx-roles.
   */
  private setPermissions(user: User): void {
    const permissions: string[] = [];
    const rolesWithPerms: Record<string, string[]> = {};

    const realmRoles = user.realm_access?.roles ?? [];

    realmRoles.forEach(role => {
      // Skip Keycloak built-in roles
      if (
        role.startsWith('default-roles-') ||
        role === 'offline_access' ||
        role === 'uma_authorization'
      ) {
        return;
      }

      // Look up predefined permissions or fall back to canRead
      const rolePerms = StartupService.ROLE_PERMS[role] ?? ['canRead'];

      permissions.push(...rolePerms);
      rolesWithPerms[role] = rolePerms;
    });

    // Add client-specific roles (optional)
    if (user.resource_access?.['clinicx-frontend']) {
      user.resource_access['clinicx-frontend'].roles.forEach(role => {
        rolesWithPerms[role] = rolesWithPerms[role] ?? [];
      });
    }

    // Deduplicate permissions before loading
    const uniquePerms = Array.from(new Set(permissions));

    // ── Push into ngx-permissions / ngx-roles ───────────────────────────
    this.permissionsService.flushPermissions();
    this.permissionsService.loadPermissions(uniquePerms);

    this.rolesService.flushRoles();
    Object.entries(rolesWithPerms).forEach(([role, perms]) =>
      this.rolesService.addRoleWithPermissions(role, perms)
    );

    // Debug
    console.log('User roles from Keycloak:', realmRoles);
    console.log('Permissions loaded:', uniquePerms);
    console.log('Roles configured:', Object.keys(rolesWithPerms));
  }
}
