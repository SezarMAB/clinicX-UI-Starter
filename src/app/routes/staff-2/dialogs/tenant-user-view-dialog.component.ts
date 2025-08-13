import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import {
  TenantUserDto,
  UserType,
} from '../../../features/tenant-user-management/tenant-user-management.models';

@Component({
  selector: 'app-tenant-user-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatCardModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person</mat-icon>
      User Details
    </h2>

    <mat-dialog-content>
      <div class="content-container">
        <!-- Basic Information Section -->
        <h3>Basic Information</h3>
        <div class="section-content">
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>account_circle</mat-icon>
              <div matListItemTitle>Username</div>
              <div matListItemLine>{{ data.username }}</div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>person</mat-icon>
              <div matListItemTitle>Full Name</div>
              <div matListItemLine>{{ data.firstName }} {{ data.lastName }}</div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>email</mat-icon>
              <div matListItemTitle>Email</div>
              <div matListItemLine>
                {{ data.email }}
                @if (data.emailVerified) {
                  <mat-icon class="verified-icon" matTooltip="Email Verified">verified</mat-icon>
                }
              </div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>badge</mat-icon>
              <div matListItemTitle>User ID</div>
              <div matListItemLine class="monospace">{{ data.userId }}</div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>category</mat-icon>
              <div matListItemTitle>User Type</div>
              <div matListItemLine>
                <mat-chip [color]="getUserTypeColor(data.userType)" selected>
                  {{ data.userType }}
                </mat-chip>
              </div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>{{ data.enabled ? 'check_circle' : 'cancel' }}</mat-icon>
              <div matListItemTitle>Status</div>
              <div matListItemLine>
                <mat-chip [color]="data.enabled ? 'primary' : 'warn'" selected>
                  {{ data.enabled ? 'Enabled' : 'Disabled' }}
                </mat-chip>
              </div>
            </mat-list-item>

            @if (data.createdAt) {
              <mat-list-item>
                <mat-icon matListItemIcon>calendar_today</mat-icon>
                <div matListItemTitle>Created At</div>
                <div matListItemLine>{{ data.createdAt | date: 'medium' }}</div>
              </mat-list-item>
            }

            @if (data.lastLogin) {
              <mat-list-item>
                <mat-icon matListItemIcon>login</mat-icon>
                <div matListItemTitle>Last Login</div>
                <div matListItemLine>{{ data.lastLogin | date: 'medium' }}</div>
              </mat-list-item>
            }
          </mat-list>
        </div>

        <mat-divider class="my-3"></mat-divider>

        <!-- Roles & Permissions Section -->
        <h3>Roles & Permissions</h3>
        <div class="section-content">
          <h3>Assigned Roles</h3>
          <mat-chip-set>
            @for (role of data.roles; track role) {
              <mat-chip [color]="getRoleBadgeColor(role)" selected>
                <mat-icon>security</mat-icon>
                {{ role }}
              </mat-chip>
            }
          </mat-chip-set>

          <mat-divider class="my-3"></mat-divider>

          <h3>Tenant Information</h3>
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>home</mat-icon>
              <div matListItemTitle>Primary Tenant</div>
              <div matListItemLine>{{ data.primaryTenantId }}</div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>business</mat-icon>
              <div matListItemTitle>Active Tenant</div>
              <div matListItemLine>{{ data.activeTenantId }}</div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>{{ data.isExternal ? 'public' : 'home_work' }}</mat-icon>
              <div matListItemTitle>Access Type</div>
              <div matListItemLine>{{ data.isExternal ? 'External User' : 'Internal User' }}</div>
            </mat-list-item>
          </mat-list>
        </div>

        <!-- Accessible Tenants Section -->
        @if (data.accessibleTenants && data.accessibleTenants.length > 0) {
          <mat-divider class="my-3"></mat-divider>
          <h3>Accessible Tenants</h3>
          <div class="section-content">
            @for (tenant of data.accessibleTenants; track tenant.tenantId) {
              <mat-card class="tenant-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>business</mat-icon>
                  <mat-card-title>{{ tenant.tenantName }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ tenant.tenantId }}
                    @if (tenant.isPrimary) {
                      <mat-chip color="primary" selected>Primary</mat-chip>
                    }
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p><strong>Clinic Type:</strong> {{ tenant.clinicType }}</p>
                  <p><strong>Roles:</strong></p>
                  <mat-chip-set>
                    @for (role of tenant.roles; track role) {
                      <mat-chip>{{ role }}</mat-chip>
                    }
                  </mat-chip-set>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        <!-- Attributes Section -->
        @if (data.attributes && getAttributeEntries().length > 0) {
          <mat-divider class="my-3"></mat-divider>
          <h3>Attributes</h3>
          <div class="section-content">
            <mat-list>
              @for (attr of getAttributeEntries(); track attr.key) {
                <mat-list-item>
                  <mat-icon matListItemIcon>label</mat-icon>
                  <div matListItemTitle>{{ attr.key }}</div>
                  <div matListItemLine>
                    @for (value of attr.values; track value) {
                      <span class="attribute-value">{{ value }}</span>
                    }
                  </div>
                </mat-list-item>
                <mat-divider></mat-divider>
              }
            </mat-list>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
      <button mat-raised-button color="primary" (click)="onEdit()">
        <mat-icon>edit</mat-icon>
        Edit User
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 500px;
        max-height: 60vh;
        overflow-y: auto;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 28px;
          height: 28px;
          width: 28px;
        }
      }

      .content-container {
        padding: 20px 0;
      }

      .section-content {
        padding: 0 20px 20px;
      }

      h3 {
        margin: 20px 20px 16px;
        color: rgba(0, 0, 0, 0.87);
        font-size: 16px;
        font-weight: 500;
      }

      .verified-icon {
        font-size: 16px;
        color: #4caf50;
        vertical-align: middle;
        margin-left: 4px;
      }

      .monospace {
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }

      .my-3 {
        margin: 24px 0;
      }

      .tenant-card {
        margin-bottom: 16px;

        mat-card-header {
          margin-bottom: 8px;
        }

        mat-icon[mat-card-avatar] {
          font-size: 40px;
          height: 40px;
          width: 40px;
        }
      }

      .attribute-value {
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
      }

      mat-chip {
        font-size: 12px;
      }

      ::ng-deep {
        .mat-mdc-list-item-unscoped-content {
          display: flex;
          align-items: center;
        }

        .mat-mdc-chip-set {
          display: inline-flex;
        }
      }
    `,
  ],
})
export class TenantUserViewDialogComponent {
  private dialogRef = inject(MatDialogRef<TenantUserViewDialogComponent>);
  data = inject<TenantUserDto>(MAT_DIALOG_DATA);

  getUserTypeColor(userType?: UserType | any): string {
    if (!userType) return '';

    // Handle UserType enum values
    if (userType === 'INTERNAL' || userType === UserType.INTERNAL) {
      return 'primary';
    }
    if (userType === 'EXTERNAL' || userType === UserType.EXTERNAL) {
      return 'accent';
    }
    if (userType === 'SUPER_ADMIN' || userType === UserType.SUPER_ADMIN) {
      return 'warn';
    }

    // Handle StaffRole values
    if (userType === 'ADMIN') return 'warn';
    if (userType === 'DOCTOR') return 'primary';
    if (userType === 'NURSE') return 'accent';

    return '';
  }

  getRoleBadgeColor(role: string): string {
    if (role.includes('ADMIN')) return 'warn';
    if (role.includes('DOCTOR')) return 'primary';
    if (role.includes('NURSE')) return 'accent';
    return '';
  }

  getAttributeEntries(): { key: string; values: readonly string[] }[] {
    if (!this.data.attributes) return [];
    return Object.entries(this.data.attributes).map(([key, values]) => ({
      key,
      values: values || [],
    }));
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.dialogRef.close({ action: 'edit', user: this.data });
  }
}
