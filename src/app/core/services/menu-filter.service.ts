import { Injectable, inject } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { Menu, MenuChildrenItem, MenuService } from '@core/bootstrap/menu.service';
import { FeatureFlagService, FeatureCode } from './feature-flag.service';
import { AuthService } from '@core/authentication';

interface MenuFeatureMapping {
  [route: string]: FeatureCode | FeatureCode[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuFilterService {
  private menuService = inject(MenuService);
  private featureFlagService = inject(FeatureFlagService);
  private authService = inject(AuthService);

  // Define menu items that require specific features
  private menuFeatureMapping: MenuFeatureMapping = {
    '/patients': 'PATIENTS',
    '/appointments': 'APPOINTMENTS',
    '/treatments': 'TREATMENTS',
    '/invoices': 'INVOICES',
    '/inventory': 'INVENTORY',
    '/lab-requests': 'LAB_REQUESTS',
    '/dental/charts': 'DENTAL_CHARTS',
    '/dental/procedures': 'DENTAL_PROCEDURES',
    '/reports/financial': 'FINANCIAL_REPORTS',
    '/reports/clinical': 'CLINICAL_NOTES',
  };

  /**
   * Get filtered menu based on current tenant's specialty
   */
  getFilteredMenu(): Observable<Menu[]> {
    return combineLatest([this.menuService.getAll(), this.authService.user()]).pipe(
      map(([allMenuItems, user]) => {
        if (!user || !user.active_tenant_id) {
          return allMenuItems;
        }

        return this.filterMenuByFeatures(allMenuItems);
      })
    );
  }

  /**
   * Filter menu items based on feature availability
   */
  private filterMenuByFeatures(menuItems: Menu[]): Menu[] {
    return menuItems
      .map(item => {
        // Clone the item to avoid mutating the original
        const filteredItem = { ...item };

        // Check if this menu item requires a specific feature
        const requiredFeatures = this.getRequiredFeatures(item.route);

        if (requiredFeatures.length > 0) {
          // Check if user has access to any of the required features
          const hasAccess = this.featureFlagService.hasAnyFeature(...requiredFeatures);
          if (!hasAccess) {
            return null; // Remove this menu item
          }
        }

        // Recursively filter children
        if (filteredItem.children && filteredItem.children.length > 0) {
          filteredItem.children = this.filterChildrenByFeatures(filteredItem.children);

          // Remove parent item if all children are filtered out
          if (filteredItem.children.length === 0 && filteredItem.type === 'sub') {
            return null;
          }
        }

        return filteredItem;
      })
      .filter(item => item !== null) as Menu[];
  }

  /**
   * Filter child menu items based on feature availability
   */
  private filterChildrenByFeatures(children: MenuChildrenItem[]): MenuChildrenItem[] {
    return children
      .map(child => {
        // Clone the child to avoid mutating the original
        const filteredChild = { ...child };

        // Check if this menu item requires a specific feature
        const requiredFeatures = this.getRequiredFeatures(child.route);

        if (requiredFeatures.length > 0) {
          const hasAccess = this.featureFlagService.hasAnyFeature(...requiredFeatures);
          if (!hasAccess) {
            return null;
          }
        }

        // Recursively filter children
        if (filteredChild.children && filteredChild.children.length > 0) {
          filteredChild.children = this.filterChildrenByFeatures(filteredChild.children);

          // Remove parent item if all children are filtered out
          if (filteredChild.children.length === 0 && filteredChild.type === 'sub') {
            return null;
          }
        }

        return filteredChild;
      })
      .filter(child => child !== null) as MenuChildrenItem[];
  }

  /**
   * Get required features for a menu route
   */
  private getRequiredFeatures(route: string): FeatureCode[] {
    const mapping = this.menuFeatureMapping[route];
    if (!mapping) {
      return [];
    }

    return Array.isArray(mapping) ? mapping : [mapping];
  }

  /**
   * Update menu with tenant context
   */
  updateMenuWithTenantContext(menuItems: Menu[]): Menu[] {
    const specialty = this.featureFlagService.currentTenantSpecialty();

    if (!specialty) {
      return menuItems;
    }

    // Add specialty-specific badges or labels to menu items
    return menuItems.map(item => {
      const updatedItem = { ...item };

      // Add specialty badge to dental items
      if (specialty === 'DENTAL' && item.route.includes('dental')) {
        updatedItem.badge = {
          color: 'primary',
          value: 'DENTAL',
        };
      }

      // Add appointments badge
      if (specialty === 'APPOINTMENTS' && item.route.includes('appointment')) {
        updatedItem.badge = {
          color: 'accent',
          value: 'APPT',
        };
      }

      return updatedItem;
    });
  }

  /**
   * Check if a menu item should be visible
   */
  isMenuItemVisible(route: string): boolean {
    const requiredFeatures = this.getRequiredFeatures(route);

    if (requiredFeatures.length === 0) {
      return true; // No feature requirements, always visible
    }

    return this.featureFlagService.hasAnyFeature(...requiredFeatures);
  }
}
