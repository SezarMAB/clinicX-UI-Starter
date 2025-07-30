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
  private readonly permissonsService = inject(NgxPermissionsService);
  private readonly rolesService = inject(NgxRolesService);
  private readonly tenantService = inject(TenantService);

  /**
   * Load the application only after get the menu or other essential informations
   * such as permissions and roles.
   */
  load() {
    return new Promise<void>((resolve, reject) => {
      this.authService
        .change()
        .pipe(
          tap(user => {
            if (user) {
              this.setPermissions(user);
              // Initialize tenant information if user is authenticated
              const userWithTenant = user as User;
              if (userWithTenant.tenant_id) {
                console.log('Tenant initialized:', {
                  tenant_id: userWithTenant.tenant_id,
                  clinic_name: userWithTenant.clinic_name,
                  clinic_type: userWithTenant.clinic_type,
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
          error: () => resolve(),
        });
    });
  }

  private setMenu(menu: Menu[]) {
    this.menuService.addNamespace(menu, 'menu');
    this.menuService.set(menu);
  }

  private setPermissions(user: User) {
    // Extract permissions from Keycloak JWT token
    const permissions: string[] = [];
    const roles: Record<string, string[]> = {};

    if (user && user.realm_access?.roles) {
      // Add realm roles as permissions
      const realmRoles = user.realm_access.roles;

      // Map StaffRole enum values to application permissions
      if (realmRoles.includes('SUPER_ADMIN')) {
        permissions.push(
          'canAdd',
          'canDelete',
          'canEdit',
          'canRead',
          'canManageUsers',
          'canManageSettings',
          'canViewReports'
        );
        roles.SUPER_ADMIN = permissions;
      } else if (realmRoles.includes('ADMIN')) {
        permissions.push(
          'canAdd',
          'canDelete',
          'canEdit',
          'canRead',
          'canManageUsers',
          'canViewReports'
        );
        roles.ADMIN = [
          'canAdd',
          'canDelete',
          'canEdit',
          'canRead',
          'canManageUsers',
          'canViewReports',
        ];
      } else if (realmRoles.includes('DOCTOR')) {
        permissions.push('canRead', 'canEdit', 'canAdd', 'canViewPatientRecords', 'canPrescribe');
        roles.DOCTOR = ['canRead', 'canEdit', 'canAdd', 'canViewPatientRecords', 'canPrescribe'];
      } else if (realmRoles.includes('NURSE')) {
        permissions.push('canRead', 'canEdit', 'canViewPatientRecords', 'canUpdateVitals');
        roles.NURSE = ['canRead', 'canEdit', 'canViewPatientRecords', 'canUpdateVitals'];
      } else if (realmRoles.includes('ASSISTANT')) {
        permissions.push('canRead', 'canEdit', 'canScheduleAppointments');
        roles.ASSISTANT = ['canRead', 'canEdit', 'canScheduleAppointments'];
      } else if (realmRoles.includes('RECEPTIONIST')) {
        permissions.push(
          'canRead',
          'canAdd',
          'canEdit',
          'canScheduleAppointments',
          'canRegisterPatients'
        );
        roles.RECEPTIONIST = [
          'canRead',
          'canAdd',
          'canEdit',
          'canScheduleAppointments',
          'canRegisterPatients',
        ];
      } else if (realmRoles.includes('ACCOUNTANT')) {
        permissions.push('canRead', 'canViewReports', 'canManageBilling', 'canGenerateInvoices');
        roles.ACCOUNTANT = ['canRead', 'canViewReports', 'canManageBilling', 'canGenerateInvoices'];
      }

      // Add clinic-specific roles if available
      if (user.resource_access && user.resource_access['clinicx-frontend']) {
        const clientRoles = user.resource_access['clinicx-frontend'].roles;
        clientRoles.forEach(role => {
          if (!roles[role]) {
            roles[role] = [];
          }
        });
      }
    }

    // Load permissions and roles
    this.permissonsService.loadPermissions(permissions);
    this.rolesService.flushRoles();

    // Add all roles with their permissions
    Object.entries(roles).forEach(([role, perms]) => {
      this.rolesService.addRoles({ [role]: perms });
    });
  }
}
